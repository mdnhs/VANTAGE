import { MediaApiError } from '@/features/media/services/api';
import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  CreateLegalPageInput,
  LegalPage,
  LegalPageListFilters,
  ReorderLegalPagesInput,
  UpdateLegalPageInput,
} from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}`;

// Keeps the server's field causes (e.g. `slug`) so the form can show them under the field.
async function parseOrThrow<T>(res: Response): Promise<{ data: T; pagination?: PaginationMeta }> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new MediaApiError(
      body?.error?.message ?? 'Request failed',
      res.status,
      body?.error?.code,
      body?.error?.causes,
    );
  }
  return { data: body.data as T, pagination: body.pagination };
}

const json = (method: string, input: unknown): RequestInit => ({
  method,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(input),
});

export async function fetchAdminLegalPageList(filters: LegalPageListFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const res = await fetch(`${BASE_URL}${API_ROUTES.legalPages.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseOrThrow<LegalPage[]>(res);
}

export async function fetchLegalPageDetail(id: string): Promise<LegalPage> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.legalPages.detail(id)}`, { credentials: 'include' });
  return (await parseOrThrow<LegalPage>(res)).data;
}

export async function createLegalPage(input: CreateLegalPageInput): Promise<LegalPage> {
  return (await parseOrThrow<LegalPage>(await fetch(`${BASE_URL}${API_ROUTES.legalPages.create}`, json('POST', input))))
    .data;
}

export async function updateLegalPage(id: string, input: UpdateLegalPageInput): Promise<LegalPage> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.legalPages.update(id)}`, json('PATCH', input));
  return (await parseOrThrow<LegalPage>(res)).data;
}

export async function deleteLegalPage(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.legalPages.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return (await parseOrThrow<{ success: true }>(res)).data;
}

export async function reorderLegalPages(input: ReorderLegalPagesInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.legalPages.reorder}`, json('PATCH', input));
  return (await parseOrThrow<{ success: true }>(res)).data;
}
