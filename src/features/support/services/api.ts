import { API_ROUTES } from '@/lib/routes/api-routes';
import type {
  SupportAgentDto,
  SupportDetailDto,
  SupportListItemDto,
  SupportMessageDto,
  SupportStatus,
} from '@/lib/support/types';

const PREFIX = `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}`;
const routes = API_ROUTES.support.admin;

export const ADMIN_STREAM_URL = `${PREFIX}${routes.stream}`;

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) throw new Error(body?.error?.message ?? 'Request failed');
  return body.data as T;
}

const get = async <T>(path: string) => parse<T>(await fetch(`${PREFIX}${path}`, { credentials: 'include' }));

const post = async <T>(path: string, data?: unknown) =>
  parse<T>(
    await fetch(`${PREFIX}${path}`, {
      method: 'POST',
      credentials: 'include',
      ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    }),
  );

export const supportApi = {
  unread: () => get<{ count: number }>(routes.unread),
  agents: () => get<SupportAgentDto[]>(routes.agents),
  list: (status: SupportStatus, limit: number) =>
    get<{ items: SupportListItemDto[]; hasMore: boolean }>(`${routes.list}?status=${status}&limit=${limit}`),
  detail: (id: string) => get<SupportDetailDto>(routes.detail(id)),
  send: (id: string, body: string) => post<SupportMessageDto>(routes.messages(id), { body }),
  markRead: (id: string) => post<{ read: boolean }>(routes.read(id)),
  assign: (id: string, userId: string | null) => post<{ assignedTo: string | null }>(routes.assign(id), { userId }),
  close: (id: string) => post<{ status: 'closed' }>(routes.close(id)),
  remove: async (id: string) =>
    parse<{ deleted: boolean }>(
      await fetch(`${PREFIX}${routes.detail(id)}`, { method: 'DELETE', credentials: 'include' }),
    ),
};
