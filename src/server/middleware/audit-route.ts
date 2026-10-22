import { createMiddleware } from 'hono/factory';

import { topLevelDiff } from '@/lib/audit/top-level-diff';
import type { AppEnv } from '@/server/api/types';
import { audit } from '@/server/lib/audit';

export const REDACTED = '[not recorded]';

type Diff = Record<string, { from: unknown; to: unknown }>;

export type AuditRouteSpec = {
  action: string;
  entityType: string;
  summary: string;
  // Loads the record before the handler runs so the change can be diffed (updates; on delete only to confirm the record existed).
  load?: (id: string) => Promise<object | null | undefined>;
  // Allowlist of keys to compare; default is every key except id and timestamps.
  fields?: readonly string[];
  // Keys whose change is recorded but whose values are not (staff notes).
  redact?: readonly string[];
};

const DEFAULT_SKIP = new Set(['id', 'createdAt', 'updatedAt']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pick = (row: object | null | undefined, keys: readonly string[] | undefined) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row ?? {})) {
    if (keys ? keys.includes(k) : !DEFAULT_SKIP.has(k)) out[k] = v;
  }
  return out;
};

export function auditDiff(
  before: object | null | undefined,
  after: object | null | undefined,
  opts: { fields?: readonly string[]; redact?: readonly string[] },
): Diff | null {
  const diff = topLevelDiff(pick(before, opts.fields), pick(after, opts.fields));
  for (const key of opts.redact ?? []) {
    if (key in diff) diff[key] = { from: REDACTED, to: REDACTED };
  }
  return Object.keys(diff).length ? diff : null;
}

// Records an admin mutation in the activity log. Place right after `can(...)`. The row is written only
// after a 2xx response; a failing audit insert is logged and never fails the already-committed change.
export const auditRoute = (spec: AuditRouteSpec) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const paramId = c.req.param('id');
    let before: object | null | undefined;
    let loadFailed = false;
    if (spec.load && paramId && UUID.test(paramId)) {
      try {
        before = await spec.load(paramId);
      } catch {
        loadFailed = true;
      }
    }
    await next();
    if (c.res.status < 200 || c.res.status >= 300) return;
    // Without the "before" record a diff would read as a full rewrite: log and write nothing.
    if (loadFailed) {
      console.error('[audit-route] load failed', spec.action);
      return;
    }
    try {
      let data: (Record<string, unknown> & { id?: unknown }) | undefined;
      try {
        data = ((await c.res.clone().json()) as { data?: typeof data }).data;
      } catch {
        data = undefined;
      }
      const entityId = paramId ?? (typeof data?.id === 'string' ? data.id : null);
      let diff: Diff | null = null;
      if (spec.load) {
        // Deleting something that was never there changed nothing: no row. A delete has no diff.
        if (!before) return;
        if (c.req.method !== 'DELETE') {
          diff = auditDiff(before, data, spec);
          if (!diff) return;
        }
      }
      await audit(c.get('actor'), {
        action: spec.action,
        entityType: spec.entityType,
        entityId,
        summary: spec.summary,
        diff,
      });
    } catch {
      console.error('[audit-route] failed', spec.action);
    }
  });
