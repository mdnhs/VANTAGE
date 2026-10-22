import { sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { newestFirst } from '@/features/globals/lib/revisions';
import { CONFLICT_MESSAGE, submitResultFromError } from '@/features/globals/lib/submit-result';
import {
  fetchGlobal,
  fetchGlobalRevisions,
  GlobalApiError,
  restoreGlobal,
  saveGlobal,
} from '@/features/globals/services/api';
import { db } from '@/server/db';

import { call, signInCookie, createTestUser } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

// The editor's real client services, with fetch pointed at the in-process API
// and a cookie jar per "browser".
let cookie = '';
const asBrowser = (who: string) => {
  cookie = who;
};
const cookies = {} as Record<'owner' | 'admin' | 'viewer', string>;

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  for (const role of ['owner', 'admin', 'viewer'] as const) {
    cookies[role] = await signInCookie((await createTestUser(role)).email);
  }
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    const path = url.replace(/^\/api\/v1/, '');
    return call(path, cookie, {
      method: init.method,
      body: init.body ? JSON.parse(init.body as string) : undefined,
    });
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

afterEach(() => vi.restoreAllMocks());

beforeEach(async () => {
  await db.execute(sql`truncate table settings, revisions, audit_logs, site_settings`);
  vi.mocked(revalidateTag).mockClear();
});

const failure = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as GlobalApiError;
  }
  throw new Error('expected the call to fail');
};

describe('two editors save the same document', () => {
  it('the second save gets a 409 the form shows as the friendly message, with the winner loaded', async () => {
    asBrowser(cookies.owner);
    const first = await fetchGlobal('contact');
    asBrowser(cookies.admin);
    const second = await fetchGlobal('contact');
    expect(first.version).toBe(second.version);

    asBrowser(cookies.owner);
    await saveGlobal('contact', { version: first.version, value: { email: 'first@example.ie' } });

    asBrowser(cookies.admin);
    const error = await failure(
      saveGlobal('contact', { version: second.version, value: { email: 'second@example.ie' } }),
    );
    expect(error).toBeInstanceOf(GlobalApiError);
    expect(error.status).toBe(409);
    expect(error.current).toMatchObject({ version: 1, updatedBy: 'Test owner' });
    expect(submitResultFromError(error)).toEqual({ formError: CONFLICT_MESSAGE });

    // The refetch the hook runs next shows the other person's version, not ours.
    const loaded = await fetchGlobal('contact');
    expect(loaded.version).toBe(1);
    expect(loaded.value).toMatchObject({ email: 'first@example.ie' });
  });
});

describe('read-only role', () => {
  it('can read a settings document but its save is refused with 403 and nothing is stored', async () => {
    asBrowser(cookies.viewer);
    const doc = await fetchGlobal('contact');
    expect(doc.version).toBe(0);
    const error = await failure(saveGlobal('contact', { version: 0, value: { email: 'nope@example.ie' } }));
    expect(error.status).toBe(403);
    expect(submitResultFromError(error)).toEqual({ formError: error.message });
    expect((await fetchGlobal('contact')).version).toBe(0);
  });

  it('cannot read settings.read-only documents at all', async () => {
    asBrowser(cookies.viewer);
    expect((await failure(fetchGlobal('site'))).status).toBe(403);
    expect((await failure(fetchGlobal('privacy'))).status).toBe(403);
  });
});

describe('history and restore', () => {
  it('lists versions newest first and restoring saves the old value as a new version', async () => {
    asBrowser(cookies.owner);
    await saveGlobal('privacy', { version: 0, value: { enquiryRetentionMonths: 12 } });
    await saveGlobal('privacy', { version: 1, value: { enquiryRetentionMonths: 36 } });
    await saveGlobal('privacy', { version: 2, value: { enquiryRetentionMonths: 48 } });

    expect(vi.mocked(revalidateTag).mock.calls).toEqual(Array(3).fill(['settings:privacy', { expire: 0 }]));
    const { items } = await fetchGlobalRevisions('privacy');
    expect(items.map((i) => i.version)).toEqual([3, 2, 1]);
    expect(newestFirst(items).map((i) => i.version)).toEqual([3, 2, 1]);
    expect(items[0]).toMatchObject({ createdByName: 'Test owner' });

    const oldest = items.at(-1)!;
    const restored = await restoreGlobal('privacy', oldest.id, { version: 3 });
    expect(restored.version).toBe(4);
    expect(vi.mocked(revalidateTag)).toHaveBeenCalledTimes(4);
    expect(vi.mocked(revalidateTag).mock.lastCall).toEqual(['settings:privacy', { expire: 0 }]);
    expect(restored.value).toMatchObject({ enquiryRetentionMonths: 12 });

    const after = await fetchGlobalRevisions('privacy');
    expect(after.items.map((i) => i.version)).toEqual([4, 3, 2, 1]);
    expect(after.items[0]).toMatchObject({ note: 'Restored version 1' });
  });

  it('restoring from a stale form is a conflict', async () => {
    asBrowser(cookies.owner);
    await saveGlobal('privacy', { version: 0, value: { enquiryRetentionMonths: 12 } });
    await saveGlobal('privacy', { version: 1, value: { enquiryRetentionMonths: 36 } });
    const { items } = await fetchGlobalRevisions('privacy');
    const error = await failure(restoreGlobal('privacy', items.at(-1)!.id, { version: 1 }));
    expect(error.status).toBe(409);
  });

  it('a read-only role cannot restore', async () => {
    asBrowser(cookies.owner);
    await saveGlobal('contact', { version: 0, value: { email: 'a@example.ie' } });
    const { items } = await fetchGlobalRevisions('contact');
    asBrowser(cookies.viewer);
    expect((await fetchGlobalRevisions('contact')).items).toHaveLength(1);
    expect((await failure(restoreGlobal('contact', items[0]!.id, { version: 1 }))).status).toBe(403);
  });
});
