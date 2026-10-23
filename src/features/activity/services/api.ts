import type { AuditDetail, AuditFacets, AuditListParams, AuditListResult } from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}/admin/audit`;

async function get<T>(path: string): Promise<{ data: T; total?: number }> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) throw new Error(body?.error?.message ?? 'Request failed');
  return { data: body.data as T, total: body.pagination?.total };
}

export async function fetchAuditList(params: AuditListParams): Promise<AuditListResult> {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  for (const key of ['actor', 'action', 'entityType', 'from', 'to'] as const) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  const { data, total } = await get<AuditListResult['items']>(`?${query.toString()}`);
  return { items: data, total: total ?? data.length };
}

export const fetchAuditFacets = async () => (await get<AuditFacets>('/facets')).data;
export const fetchAuditEntry = async (id: string) => (await get<AuditDetail>(`/${id}`)).data;
