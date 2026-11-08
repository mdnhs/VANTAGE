import { API_ROUTES } from '@/lib/routes/api-routes';
import type { VisitorConversationDto } from '@/lib/support/types';

const PREFIX = `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}`;
const routes = API_ROUTES.support.visitor;

export const VISITOR_STREAM_URL = `${PREFIX}${routes.stream}`;

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) throw new Error(body?.error?.message ?? 'Something went wrong, please try again');
  return body.data as T;
}

const post = async <T>(path: string, data: unknown) =>
  parse<T>(
    await fetch(`${PREFIX}${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  );

export const visitorApi = {
  status: async () =>
    parse<{ online: boolean }>(await fetch(`${PREFIX}${routes.status}`, { credentials: 'same-origin' })),
  conversation: async () =>
    parse<VisitorConversationDto | null>(
      await fetch(`${PREFIX}${routes.conversation}`, { credentials: 'same-origin' }),
    ),
  start: (data: { body: string; sourcePath: string; website: string }) =>
    post<VisitorConversationDto>(routes.start, data),
  send: (body: string) => post<VisitorConversationDto>(routes.messages, { body }),
  contact: (email: string) => post<{ hasEmail: boolean }>(routes.contact, { email }),
};
