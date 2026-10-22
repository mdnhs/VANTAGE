import 'server-only';

import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { toCsv } from '@/server/lib/csv';
import { ApiError } from '@/server/lib/errors';
import * as repo from '@/server/repositories/audit-repository';
import type { AuditExportQuery, AuditListQuery } from '@/validations/audit-schema';

export const NO_ENTRY = 'That activity entry no longer exists';

export type AuditEntryDto = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  impersonatorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  hasDiff: boolean;
  createdAt: string;
};

export type AuditDetailDto = AuditEntryDto & { diff: Record<string, { from: unknown; to: unknown }> | null };

const toDto = <T extends { createdAt: Date }>(row: T): Omit<T, 'createdAt'> & { createdAt: string } => ({
  ...row,
  createdAt: row.createdAt.toISOString(),
});

function toFilters(query: AuditExportQuery): repo.AuditFilters {
  const { actor, ...rest } = query;
  return { ...rest, actorId: actor };
}

export async function listAuditEntries(query: AuditListQuery) {
  const { items, total } = await repo.listAudit(toFilters(query), query.page, query.pageSize);
  return { items: items.map(toDto) as AuditEntryDto[], total };
}

export async function getAuditEntry(id: string): Promise<AuditDetailDto> {
  const row = await repo.getAudit(id);
  if (!row) throw ApiError.notFound(NO_ENTRY);
  return toDto(row) as AuditDetailDto;
}

export const getAuditFacets = () => repo.auditFacets();

const COLUMNS = [
  { key: 'when', label: 'When' },
  { key: 'who', label: 'Who' },
  { key: 'email', label: 'Email' },
  { key: 'viewingAsBy', label: 'Viewing-as by' },
  { key: 'action', label: 'Action' },
  { key: 'entity', label: 'Entity' },
  { key: 'entityId', label: 'Entity ID' },
  { key: 'summary', label: 'Summary' },
];

export async function exportAuditCsv(actor: Actor, query: AuditExportQuery): Promise<string> {
  const fetched = await repo.exportAudit(toFilters(query));
  const capped = fetched.length > repo.EXPORT_LIMIT;
  const rows = capped ? fetched.slice(0, repo.EXPORT_LIMIT) : fetched;
  const data: Record<string, unknown>[] = rows.map((row) => ({
    when: row.createdAt,
    who: row.actorName ?? row.actorEmail ?? 'System',
    email: row.actorEmail,
    viewingAsBy: row.impersonatorName,
    action: row.action,
    entity: row.entityType,
    entityId: row.entityId,
    summary: row.summary,
  }));
  // A final row says the export stopped early, so a partial file is never mistaken for the whole log.
  if (capped) {
    data.push({
      who: 'System',
      action: 'export.capped',
      summary: `Export capped at ${repo.EXPORT_LIMIT} entries. Narrow the filters to see the rest.`,
    });
  }
  const csv = toCsv(data, COLUMNS);
  await audit(actor, {
    action: 'audit.export',
    entityType: 'audit',
    summary: `Exported ${rows.length} activity ${rows.length === 1 ? 'entry' : 'entries'}${capped ? ` (capped at ${repo.EXPORT_LIMIT})` : ''}`,
  });
  return csv;
}
