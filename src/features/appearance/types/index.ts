import type { ContrastIssue } from '@/lib/theme/checks';
import type { ThemeConfigValue } from '@/lib/theme/schema';

// What GET /admin/theme and every draft mutation answer.
export type ThemeAdminDoc = {
  value: ThemeConfigValue;
  draft: ThemeConfigValue;
  hasDraft: boolean;
  version: number;
  updatedAt: string | null;
  issues: ContrastIssue[];
};

export type ThemeRevision = {
  id: string;
  version: number;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
  createdByName: string | null;
};

export type ThemeResetScope = 'site' | 'admin' | 'both';
