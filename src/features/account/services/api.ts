const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}/account`;

export type Device = { id: string; device: string; lastActiveAt: string; current: boolean };

export class AccountApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) throw new AccountApiError(body?.error?.message ?? 'Request failed', body?.error?.code);
  return body.data as T;
}

const send = (path: string, method: string) => fetch(`${BASE_URL}${path}`, { method, credentials: 'include' });

export const fetchDevices = async () => parse<Device[]>(await send('/sessions', 'GET'));
export const revokeDevice = async (id: string) =>
  parse<unknown>(await send(`/sessions/${encodeURIComponent(id)}`, 'DELETE'));
export const revokeOtherDevices = async () => parse<unknown>(await send('/sessions/revoke-others', 'POST'));
