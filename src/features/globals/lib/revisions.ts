import { relativeTime } from '@/components/admin/dashboard/format';

import type { GlobalRevision } from '../types';

// Newest version first, whatever order the API returned.
export const newestFirst = (items: readonly GlobalRevision[]): GlobalRevision[] =>
  [...items].sort((a, b) => b.version - a.version);

// "Version 3 · Alex · 2 hours ago"
export function revisionSummary(item: GlobalRevision, now: number): string {
  return `Version ${item.version} · ${item.createdByName ?? 'Someone'} · ${relativeTime(item.createdAt, now)}`;
}
