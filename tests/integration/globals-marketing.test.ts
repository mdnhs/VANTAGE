import { sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';

import { call, createTestUser, signInCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

type Body = {
  success: boolean;
  data: { version: number; value: Record<string, unknown> };
  error: { code: string; causes?: Record<string, string[]> };
};
const json = async (res: Response) => (await res.json()) as Body;
const put = (cookie: string, key: string, body: unknown) =>
  call(`/admin/globals/${key}`, cookie, { method: 'PUT', body });

const cookies = {} as Record<RoleName, string>;

beforeAll(async () => {
  for (const role of ROLE_NAMES) {
    cookies[role] = await signInCookie((await createTestUser(role)).email);
  }
});

beforeEach(async () => {
  await db.execute(sql`truncate table settings, revisions, audit_logs`);
  vi.mocked(revalidateTag).mockClear();
});

describe('scripts global is owner-only (code.update)', () => {
  it('refuses an admin and lets the owner read it', async () => {
    expect((await call('/admin/globals/scripts', cookies.admin)).status).toBe(403);
    const res = await call('/admin/globals/scripts', cookies.owner);
    expect(res.status).toBe(200);
    expect((await json(res)).data.value).toMatchObject({ snippets: [] });
  });

  it('refuses an admin write and nothing is stored', async () => {
    expect((await put(cookies.admin, 'scripts', { version: 0, value: { snippets: [] } })).status).toBe(403);
    expect((await put(cookies.owner, 'scripts', { version: 0, value: { snippets: [] } })).status).toBe(200);
  });
});

describe('consent global (tracking.update)', () => {
  const value = { enabled: false, title: 'Cookies on this site' };

  it('lets a marketer save and refuses an editor', async () => {
    expect((await put(cookies.marketer, 'consent', { version: 0, value })).status).toBe(200);
    expect((await put(cookies.editor, 'consent', { version: 1, value })).status).toBe(403);
  });

  it('rejects enabling the banner with a blank title as a 422 on title', async () => {
    const res = await put(cookies.marketer, 'consent', { version: 0, value: { ...value, enabled: true, title: '' } });
    expect(res.status).toBe(422);
    const body = await json(res);
    expect(body.error.causes?.title).toBeDefined();
  });
});
