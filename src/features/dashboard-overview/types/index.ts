import type { QuoteRequest } from '@/server/db/schema';

export interface DashboardKPIs {
  totalInquiries: number;
  totalNewEnquiries: number;
  activeJobs: number;
  completedWork: number;
  pendingQuotes: number;
  salesRevenue: number;
  pipelineValue: number;
  conversionRate: number;
}

export interface MonthlyTrendItem {
  monthKey: string; // e.g. "2026-09"
  monthLabel: string; // e.g. "Sep 2026"
  shortLabel: string; // e.g. "Sep"
  inquiries: number;
  completed: number;
  revenue: number;
}

export interface ChannelBreakdownItem {
  source: string;
  count: number;
  percentage: number;
}

export interface DashboardOverviewData {
  kpis: DashboardKPIs;
  monthlyTrends: MonthlyTrendItem[];
  channels: ChannelBreakdownItem[];
  recentLeads: QuoteRequest[];
}
