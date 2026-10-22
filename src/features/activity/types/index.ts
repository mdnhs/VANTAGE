export type AuditRow = {
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

export type AuditDetail = AuditRow & { diff: Record<string, { from: unknown; to: unknown }> | null };

export type AuditFacets = {
  actions: string[];
  entityTypes: string[];
  actors: { id: string; label: string }[];
};

export type AuditListParams = {
  page: number;
  pageSize: number;
  action?: string;
  actor?: string;
  entityType?: string;
  from?: string;
  to?: string;
};

export type AuditListResult = { items: AuditRow[]; total: number };
