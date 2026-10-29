import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { isEnabled } = vi.hoisted(() => ({ isEnabled: { value: false } }));
vi.mock('next/headers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/headers')>()),
  draftMode: async () => ({
    get isEnabled() {
      return isEnabled.value;
    },
  }),
}));
vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

import { parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { settings } from '@/server/db/schema';
import { getSetting } from '@/server/queries/get-setting';

const withEyebrow = (eyebrow: string) => {
  const value = parseGlobal('page.services', {});
  return { ...value, hero: { ...value.hero, eyebrow } };
};

beforeEach(async () => {
  await db.execute(sql`truncate table settings`);
  isEnabled.value = false;
});

describe('getSetting and page drafts', () => {
  beforeEach(async () => {
    await db.insert(settings).values({ key: 'page.services', value: withEyebrow('Live'), draft: withEyebrow('Draft') });
  });

  it('serves the published copy to visitors', async () => {
    expect((await getSetting('page.services')).hero.eyebrow).toBe('Live');
  });

  it('serves the draft inside the admin preview (draft mode)', async () => {
    isEnabled.value = true;
    expect((await getSetting('page.services')).hero.eyebrow).toBe('Draft');
  });

  it('falls back to the published copy when there is no draft', async () => {
    await db.execute(sql`update settings set draft = null`);
    isEnabled.value = true;
    expect((await getSetting('page.services')).hero.eyebrow).toBe('Live');
  });

  it('never previews drafts of non-page settings', async () => {
    const contact = parseGlobal('contact', {});
    await db
      .insert(settings)
      .values({ key: 'contact', value: contact, draft: { ...contact, email: 'draft@example.com' } });
    isEnabled.value = true;
    expect((await getSetting('contact')).email).toBe(contact.email);
  });
});
