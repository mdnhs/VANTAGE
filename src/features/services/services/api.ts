import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  CreateServiceInput,
  ReorderServicesInput,
  Service,
  ServiceListFilters,
  ServicePublic,
  UpdateServiceInput,
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

export async function fetchPublicServices(): Promise<ServicePublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.services.public}`);
  return parseOrThrow<ServicePublic[]>(res);
}

export async function fetchAdminServiceList(
  filters: ServiceListFilters,
): Promise<{ data: Service[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const res = await fetch(`${BASE_URL}${API_ROUTES.services.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<Service[]>(res);
}

export async function fetchServiceDetail(id: string): Promise<Service> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.services.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<Service>(res);
}

export async function createService(input: CreateServiceInput): Promise<Service> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.services.create}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Service>(res);
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.services.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Service>(res);
}

export async function deleteService(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.services.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}

export async function reorderServices(input: ReorderServicesInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.services.reorder}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ success: true }>(res);
}
