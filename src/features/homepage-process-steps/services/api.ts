import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  CreateHomepageProcessStepInput,
  HomepageProcessStep,
  HomepageProcessStepListFilters,
  HomepageProcessStepPublic,
  ReorderHomepageProcessStepsInput,
  UpdateHomepageProcessStepInput,
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

export async function fetchPublicHomepageProcessSteps(): Promise<HomepageProcessStepPublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageProcessSteps.public}`);
  return parseOrThrow<HomepageProcessStepPublic[]>(res);
}

export async function fetchAdminHomepageProcessStepList(
  filters: HomepageProcessStepListFilters,
): Promise<{ data: HomepageProcessStep[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageProcessSteps.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<HomepageProcessStep[]>(res);
}

export async function fetchHomepageProcessStepDetail(id: string): Promise<HomepageProcessStep> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageProcessSteps.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<HomepageProcessStep>(res);
}

export async function createHomepageProcessStep(input: CreateHomepageProcessStepInput): Promise<HomepageProcessStep> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageProcessSteps.create}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<HomepageProcessStep>(res);
}

export async function updateHomepageProcessStep(
  id: string,
  input: UpdateHomepageProcessStepInput,
): Promise<HomepageProcessStep> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageProcessSteps.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<HomepageProcessStep>(res);
}

export async function deleteHomepageProcessStep(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageProcessSteps.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}

export async function reorderHomepageProcessSteps(input: ReorderHomepageProcessStepsInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.homepageProcessSteps.reorder}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ success: true }>(res);
}
