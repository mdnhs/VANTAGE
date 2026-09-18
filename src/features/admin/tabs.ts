import { Inbox, Users, GitBranch, Kanban, ShieldCheck, BarChart3 } from 'lucide-react';
import type { AdminTab } from './types';

// The 6 workflow modules. 'overview' has no entry here — it is the bare /dashboard route.
export const WORKFLOW_TABS: { id: Exclude<AdminTab, 'overview'>; title: string; icon: typeof Inbox }[] = [
  { id: 'enquiries', title: 'New Enquiries', icon: Inbox },
  { id: 'customers', title: 'Customer Records', icon: Users },
  { id: 'lifecycle', title: 'Follow-up & Lifecycle', icon: GitBranch },
  { id: 'pipeline', title: 'Job Status Tracking', icon: Kanban },
  { id: 'staff', title: 'Staff Access', icon: ShieldCheck },
  { id: 'reports', title: 'Reports', icon: BarChart3 },
];

export function parseAdminTab(value: string | string[] | undefined): AdminTab {
  return WORKFLOW_TABS.find((tab) => tab.id === value)?.id ?? 'overview';
}
