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

export type NextUpItem = {
  id: 'enquiry' | 'two-factor' | 'invite';
  title: string;
  description: string;
  cta: string;
  href: string;
  done: boolean;
};

// The MK dashboard answer. Every block is null when the viewer's role may not
// see it, so a role never receives data it cannot read.
export type DashboardDto = {
  generatedAt: string;
  enquiries: { value: number; previous: number } | null;
  enquiriesWeek: {
    days: { key: string; label: string; current: number; previous: number }[];
    current: number;
    previous: number;
  } | null;
  seoHealth: { score: number; issues: number } | null;
  contentHealth: {
    complete: number;
    needsWork: number;
    missing: number;
    findings: { label: string; message: string; href: string }[] | null;
    findingsTotal: number;
  } | null;
  recentActivity:
    | {
        id: string;
        actorName: string | null;
        actorEmail: string | null;
        action: string;
        summary: string;
        createdAt: string;
      }[]
    | null;
  nextUp: NextUpItem[];
  pipeline: DashboardOverviewData | null;
};
