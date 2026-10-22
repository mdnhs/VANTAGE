import 'server-only';

import { and, asc, count, desc, eq, gte, lt, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { dublinMidnight } from '@/lib/time/dublin';
import { db } from '@/server/db';
import { auditLogs, users } from '@/server/db/schema';

const impersonator = alias(users, 'impersonator');

export type AuditFilters = {
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
};

// Date filters are Irish calendar days, both ends inclusive.
function where(filters: AuditFilters): SQL | undefined {
  const parts: SQL[] = [];
  if (filters.actorId) parts.push(eq(auditLogs.actorId, filters.actorId));
  if (filters.action) parts.push(eq(auditLogs.action, filters.action));
  if (filters.entityType) parts.push(eq(auditLogs.entityType, filters.entityType));
  if (filters.entityId) parts.push(eq(auditLogs.entityId, filters.entityId));
  if (filters.from) parts.push(gte(auditLogs.createdAt, dublinMidnight(filters.from)));
  if (filters.to) parts.push(lt(auditLogs.createdAt, dublinMidnight(filters.to, 1)));
  return parts.length ? and(...parts) : undefined;
}

// Never selects ipHash or userAgent.
const listColumns = {
  id: auditLogs.id,
  actorId: auditLogs.actorId,
  actorEmail: auditLogs.actorEmail,
  actorName: users.name,
  action: auditLogs.action,
  entityType: auditLogs.entityType,
  entityId: auditLogs.entityId,
  impersonatorName: impersonator.name,
  summary: auditLogs.summary,
  hasDiff: sql<boolean>`${auditLogs.diff} is not null`,
  createdAt: auditLogs.createdAt,
};

export type AuditRowDb = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  impersonatorName: string | null;
  summary: string;
  hasDiff: boolean;
  createdAt: Date;
};

export async function listAudit(
  filters: AuditFilters,
  page: number,
  pageSize: number,
): Promise<{ items: AuditRowDb[]; total: number }> {
  const condition = where(filters);
  const [items, [counted]] = await Promise.all([
    db
      .select(listColumns)
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .leftJoin(impersonator, eq(impersonator.id, auditLogs.impersonatedBy))
      .where(condition)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(auditLogs).where(condition),
  ]);
  return { items, total: counted?.total ?? 0 };
}

export async function getAudit(id: string) {
  const [row] = await db
    .select({ ...listColumns, diff: auditLogs.diff })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .leftJoin(impersonator, eq(impersonator.id, auditLogs.impersonatedBy))
    .where(eq(auditLogs.id, id));
  return row ?? null;
}

export const EXPORT_LIMIT = 10_000;

export async function exportAudit(filters: AuditFilters) {
  return db
    .select({
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: auditLogs.actorEmail,
      impersonatorName: impersonator.name,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      summary: auditLogs.summary,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .leftJoin(impersonator, eq(impersonator.id, auditLogs.impersonatedBy))
    .where(where(filters))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(EXPORT_LIMIT);
}

export async function auditFacets(): Promise<{
  actions: string[];
  entityTypes: string[];
  actors: { id: string; label: string }[];
}> {
  const [actions, actors, entityTypes] = await Promise.all([
    db.selectDistinct({ action: auditLogs.action }).from(auditLogs).orderBy(asc(auditLogs.action)),
    db
      .selectDistinct({ id: users.id, name: users.name, email: users.email })
      .from(auditLogs)
      .innerJoin(users, eq(users.id, auditLogs.actorId))
      .orderBy(asc(users.name)),
    db.selectDistinct({ entityType: auditLogs.entityType }).from(auditLogs).orderBy(asc(auditLogs.entityType)),
  ]);
  return {
    actions: actions.map((row) => row.action),
    entityTypes: entityTypes.map((row) => row.entityType),
    actors: actors.map((row) => ({ id: row.id, label: `${row.name} (${row.email})` })),
  };
}
