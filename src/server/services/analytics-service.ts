import { desc, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { quoteRequests } from '@/server/db/schema';
import type {
  DashboardKPIs,
  DashboardOverviewData,
  MonthlyTrendItem,
  ChannelBreakdownItem,
} from '@/features/dashboard-overview/types';

export const analyticsService = {
  async getOverviewData(): Promise<DashboardOverviewData> {
    const [kpiRow] = await db
      .select({
        totalAll: sql<number>`count(*)::int`,
        totalNew: sql<number>`count(*) filter (where ${quoteRequests.status} = 'new')::int`,
        activeJobs: sql<number>`count(*) filter (where ${quoteRequests.status} in ('in_progress', 'approved'))::int`,
        completedWork: sql<number>`count(*) filter (where ${quoteRequests.status} = 'completed')::int`,
        pendingQuotes: sql<number>`count(*) filter (where ${quoteRequests.status} in ('quote_sent', 'waiting_response', 'quoted'))::int`,
        salesRevenue: sql<string>`coalesce(sum(cast(${quoteRequests.estimatedCost} as numeric)) filter (where ${quoteRequests.status} in ('approved', 'in_progress', 'completed')), 0)::text`,
        pipelineValue: sql<string>`coalesce(sum(cast(${quoteRequests.estimatedCost} as numeric)) filter (where ${quoteRequests.status} not in ('cancelled', 'archived')), 0)::text`,
      })
      .from(quoteRequests);

    const totalInquiries = kpiRow?.totalAll ?? 0;
    const totalNewEnquiries = kpiRow?.totalNew ?? 0;
    const activeJobs = kpiRow?.activeJobs ?? 0;
    const completedWork = kpiRow?.completedWork ?? 0;
    const pendingQuotes = kpiRow?.pendingQuotes ?? 0;
    const salesRevenue = parseFloat(kpiRow?.salesRevenue ?? '0') || 0;
    const pipelineValue = parseFloat(kpiRow?.pipelineValue ?? '0') || 0;

    const conversionRate = totalInquiries > 0 ? Math.round(((activeJobs + completedWork) / totalInquiries) * 100) : 0;

    const kpis: DashboardKPIs = {
      totalInquiries,
      totalNewEnquiries,
      activeJobs,
      completedWork,
      pendingQuotes,
      salesRevenue,
      pipelineValue,
      conversionRate,
    };

    // 2. Monthly Trend Data (Last 6 months)
    const monthlyRaw = await db
      .select({
        monthKey: sql<string>`to_char(${quoteRequests.createdAt}, 'YYYY-MM')`,
        monthLabel: sql<string>`to_char(${quoteRequests.createdAt}, 'Mon YYYY')`,
        shortLabel: sql<string>`to_char(${quoteRequests.createdAt}, 'Mon')`,
        inquiries: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${quoteRequests.status} = 'completed')::int`,
        revenue: sql<string>`coalesce(sum(cast(${quoteRequests.estimatedCost} as numeric)) filter (where ${quoteRequests.status} in ('approved', 'in_progress', 'completed')), 0)::text`,
      })
      .from(quoteRequests)
      .groupBy(
        sql`to_char(${quoteRequests.createdAt}, 'YYYY-MM')`,
        sql`to_char(${quoteRequests.createdAt}, 'Mon YYYY')`,
        sql`to_char(${quoteRequests.createdAt}, 'Mon')`,
        sql`date_trunc('month', ${quoteRequests.createdAt})`,
      )
      .orderBy(sql`date_trunc('month', ${quoteRequests.createdAt}) asc`)
      .limit(6);

    // Ensure we always have at least a 6-month timeline structure
    const monthlyTrends: MonthlyTrendItem[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IE', { month: 'short', year: 'numeric' });
      const short = d.toLocaleDateString('en-IE', { month: 'short' });

      const found = monthlyRaw.find((m) => m.monthKey === key);
      if (found) {
        monthlyTrends.push({
          monthKey: key,
          monthLabel: found.monthLabel || label,
          shortLabel: found.shortLabel || short,
          inquiries: found.inquiries || 0,
          completed: found.completed || 0,
          revenue: parseFloat(found.revenue || '0') || 0,
        });
      } else {
        monthlyTrends.push({
          monthKey: key,
          monthLabel: label,
          shortLabel: short,
          inquiries: 0,
          completed: 0,
          revenue: 0,
        });
      }
    }

    // 3. Channels Distribution
    const channelsRaw = await db
      .select({
        source: quoteRequests.source,
        count: sql<number>`count(*)::int`,
      })
      .from(quoteRequests)
      .groupBy(quoteRequests.source)
      .orderBy(desc(sql`count(*)`));

    const channels: ChannelBreakdownItem[] = channelsRaw.map((c) => ({
      source: c.source || 'website',
      count: c.count,
      percentage: totalInquiries > 0 ? Math.round((c.count / totalInquiries) * 100) : 0,
    }));

    // 4. Recent Leads
    const recentLeads = await db.query.quoteRequests.findMany({
      orderBy: [desc(quoteRequests.createdAt)],
      limit: 5,
    });

    return {
      kpis,
      monthlyTrends,
      channels,
      recentLeads,
    };
  },
};
