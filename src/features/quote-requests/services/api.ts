import { API_ROUTES } from '@/lib/routes/api-routes';
import type { PaginationMeta } from '@/server/lib/response';
import type {
  CreateQuoteRequestInput,
  QuoteRequest,
  QuoteRequestListQuery,
  QuoteRequestStats,
  UpdateQuoteRequestInput,
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
export async function submitQuoteRequest(input: CreateQuoteRequestInput): Promise<QuoteRequest> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.quotes.submit}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<QuoteRequest>(res);
}

// Admin list with pagination & filters
export async function fetchAdminQuoteRequestList(
  query: QuoteRequestListQuery,
): Promise<{ data: QuoteRequest[]; pagination?: PaginationMeta }> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    status: query.status,
  });
  if (query.search) {
    params.set('search', query.search);
  }

  const res = await fetch(`${BASE_URL}${API_ROUTES.quotes.adminList}?${params.toString()}`, {
    credentials: 'include',
  });
  return parseWithPagination<QuoteRequest[]>(res);
}

// Admin stats (counts by status)
export async function fetchQuoteRequestStats(): Promise<QuoteRequestStats> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.quotes.stats}`, {
    credentials: 'include',
  });
  return parseOrThrow<QuoteRequestStats>(res);
}

// Admin detail
export async function fetchQuoteRequestDetail(id: string): Promise<QuoteRequest> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.quotes.detail(id)}`, {
    credentials: 'include',
  });
  return parseOrThrow<QuoteRequest>(res);
}

// Admin update (status, notes, estimatedCost)
export async function updateQuoteRequest(id: string, input: UpdateQuoteRequestInput): Promise<QuoteRequest> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.quotes.update(id)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseOrThrow<QuoteRequest>(res);
}

// Admin delete
export async function deleteQuoteRequest(id: string): Promise<{ success: true }> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.quotes.remove(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseOrThrow<{ success: true }>(res);
}
