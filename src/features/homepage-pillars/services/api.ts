import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  CreateHomepagePillarInput,
  HomepagePillar,
  HomepagePillarListFilters,
  HomepagePillarPublic,
  ReorderHomepagePillarsInput,
  UpdateHomepagePillarInput,
} from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Request failed');
  }
  return body.data as T;
}

async function parseWithPagination<T>(res: Response): Promise<{ data: T; pagination?: PaginationMeta }> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Request failed');
  }
  return { data: body.data as T, pagination: body.pagination };
}

export async function fetchPublicHomepagePillars(): Promise<HomepagePillarPublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepagePillars.public}`);
  return parseOrThrow<HomepagePillarPublic[]>(res);
}

export async function fetchAdminHomepagePillarList(
  filters: HomepagePillarListFilters,
): Promise<{ data: HomepagePillar[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepagePillars.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<HomepagePillar[]>(res);
}

export async function fetchHomepagePillarDetail(id: string): Promise<HomepagePillar> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepagePillars.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<HomepagePillar>(res);
}

export async function createHomepagePillar(input: CreateHomepagePillarInput): Promise<HomepagePillar> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepagePillars.create}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<HomepagePillar>(res);
}

export async function updateHomepagePillar(id: string, input: UpdateHomepagePillarInput): Promise<HomepagePillar> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepagePillars.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<HomepagePillar>(res);
}

export async function deleteHomepagePillar(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepagePillars.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}

export async function reorderHomepagePillars(input: ReorderHomepagePillarsInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepagePillars.reorder}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ success: true }>(res);
}
