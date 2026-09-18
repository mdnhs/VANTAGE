import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  CreateHomepageCatalogInput,
  HomepageCatalog,
  HomepageCatalogListFilters,
  HomepageCatalogPublic,
  ReorderHomepageCatalogsInput,
  UpdateHomepageCatalogInput,
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

export async function fetchPublicHomepageCatalogs(): Promise<HomepageCatalogPublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageCatalogs.public}`);
  return parseOrThrow<HomepageCatalogPublic[]>(res);
}

export async function fetchAdminHomepageCatalogList(
  filters: HomepageCatalogListFilters,
): Promise<{ data: HomepageCatalog[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageCatalogs.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<HomepageCatalog[]>(res);
}

export async function fetchHomepageCatalogDetail(id: string): Promise<HomepageCatalog> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageCatalogs.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<HomepageCatalog>(res);
}

export async function createHomepageCatalog(input: CreateHomepageCatalogInput): Promise<HomepageCatalog> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageCatalogs.create}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<HomepageCatalog>(res);
}

export async function updateHomepageCatalog(id: string, input: UpdateHomepageCatalogInput): Promise<HomepageCatalog> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageCatalogs.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<HomepageCatalog>(res);
}

export async function deleteHomepageCatalog(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageCatalogs.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}

export async function reorderHomepageCatalogs(input: ReorderHomepageCatalogsInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageCatalogs.reorder}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ success: true }>(res);
}
