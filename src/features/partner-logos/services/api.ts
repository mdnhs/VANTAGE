import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  CreatePartnerLogoInput,
  PartnerLogo,
  PartnerLogoListFilters,
  PartnerLogoPublic,
  ReorderPartnerLogosInput,
  UpdatePartnerLogoInput,
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

export async function fetchPublicPartnerLogos(): Promise<PartnerLogoPublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.partnerLogos.public}`);
  return parseOrThrow<PartnerLogoPublic[]>(res);
}

export async function fetchAdminPartnerLogoList(
  filters: PartnerLogoListFilters,
): Promise<{ data: PartnerLogo[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const res = await fetch(`${BASE_URL}${API_ROUTES.partnerLogos.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<PartnerLogo[]>(res);
}

export async function fetchPartnerLogoDetail(id: string): Promise<PartnerLogo> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.partnerLogos.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<PartnerLogo>(res);
}

export async function createPartnerLogo(input: CreatePartnerLogoInput): Promise<PartnerLogo> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.partnerLogos.create}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<PartnerLogo>(res);
}

export async function updatePartnerLogo(id: string, input: UpdatePartnerLogoInput): Promise<PartnerLogo> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.partnerLogos.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<PartnerLogo>(res);
}

export async function deletePartnerLogo(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.partnerLogos.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}

export async function reorderPartnerLogos(input: ReorderPartnerLogosInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.partnerLogos.reorder}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ success: true }>(res);
}
