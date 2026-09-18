import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  ContactMessage,
  ContactMessageListQuery,
  ContactMessageStats,
  CreateContactMessageInput,
  UpdateContactMessageInput,
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

// Public submission
export async function submitContactMessage(input: CreateContactMessageInput): Promise<ContactMessage> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.contacts.submit}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<ContactMessage>(res);
}

// Admin list with pagination & filters
export async function fetchAdminContactMessageList(
  query: ContactMessageListQuery,
): Promise<{ data: ContactMessage[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    status: query.status,
  });
  if (query.search) {
    params.set('search', query.search);
  }

  const res = await fetch(`${BASE_URL}${API_ROUTES.contacts.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<ContactMessage[]>(res);
}

// Admin stats (counts by status)
export async function fetchContactMessageStats(): Promise<ContactMessageStats> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.contacts.stats}`, {
    credentials: 'include',
  });
  return parseOrThrow<ContactMessageStats>(res);
}

// Admin detail
export async function fetchContactMessageDetail(id: string): Promise<ContactMessage> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.contacts.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<ContactMessage>(res);
}

// Admin update (status, notes)
export async function updateContactMessage(id: string, input: UpdateContactMessageInput): Promise<ContactMessage> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.contacts.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<ContactMessage>(res);
}

// Admin delete
export async function deleteContactMessage(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.contacts.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}
