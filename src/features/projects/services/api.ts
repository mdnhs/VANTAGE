import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  Project,
  ProjectCreatePayload,
  ProjectListFilters,
  ProjectPublic,
  ProjectStatusInput,
  ProjectUpdatePayload,
  ReorderProjectsInput,
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

export async function fetchPublicProjects(): Promise<ProjectPublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.public}`);
  return parseOrThrow<ProjectPublic[]>(res);
}

export async function fetchFeaturedProjects(): Promise<ProjectPublic[]> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.featured}`);
  return parseOrThrow<ProjectPublic[]>(res);
}

export async function fetchAdminProjectList(
  filters: ProjectListFilters,
): Promise<{ data: Project[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<Project[]>(res);
}

export async function fetchProjectDetail(id: string): Promise<Project> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<Project>(res);
}

export async function createProject(input: ProjectCreatePayload): Promise<Project> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.create}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Project>(res);
}

export async function updateProject(id: string, input: ProjectUpdatePayload): Promise<Project> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Project>(res);
}

export async function deleteProject(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}

export async function updateProjectStatus(id: string, input: ProjectStatusInput): Promise<Project> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.updateStatus(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Project>(res);
}

export async function reorderProjects(input: ReorderProjectsInput): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.projects.reorder}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ success: true }>(res);
}
