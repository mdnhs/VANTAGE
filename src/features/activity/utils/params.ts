import { parseAsInteger, parseAsIsoDate, parseAsString } from 'nuqs';

import type { AuditListParams } from '../types';

// URL state for /dashboard/activity (hand-editable and shareable).
export const activityParsers = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
  action: parseAsString,
  actor: parseAsString,
  entityType: parseAsString,
  from: parseAsIsoDate,
  to: parseAsIsoDate,
};

// The one date helper. parseAsIsoDate reads YYYY-MM-DD as UTC midnight, so slicing the ISO string gives the
// same calendar day back. An Invalid Date, a year past 9999 or a day outside the API's 1900-2100 window is
// no day at all.
export function toDay(date: Date | null): string | undefined {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  const day = date.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  return day >= '1900-01-01' && day <= '2100-12-31' ? day : undefined;
}

// VANTAGE user ids are text, not uuids.
const ACTOR = /^[A-Za-z0-9_-]{1,64}$/;

// Anything the API would reject is dropped so a bad link shows sensible results, not a raw 422.
export function toAuditParams(state: {
  page: number;
  pageSize: number;
  action: string | null;
  actor: string | null;
  entityType: string | null;
  from: Date | null;
  to: Date | null;
}): AuditListParams {
  const action = state.action?.trim();
  const entityType = state.entityType?.trim();
  let from = toDay(state.from);
  let to = toDay(state.to);
  if (from && to && from > to) [from, to] = [to, from];
  return {
    page: Math.max(1, Math.trunc(state.page) || 1),
    pageSize: Math.min(100, Math.max(1, Math.trunc(state.pageSize) || 20)),
    action: action && action.length <= 64 ? action : undefined,
    actor: state.actor && ACTOR.test(state.actor) ? state.actor : undefined,
    entityType: entityType && entityType.length <= 32 ? entityType : undefined,
    from,
    to,
  };
}

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}/admin/audit`;

// The CSV export carries the filters but not the paging.
export function exportHref(params: AuditListParams): string {
  const query = new URLSearchParams();
  for (const key of ['actor', 'action', 'entityType', 'from', 'to'] as const) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  return `${BASE_URL}/export.csv${qs ? `?${qs}` : ''}`;
}
