import { readFileSync } from 'node:fs';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { settings } from '@/server/db/schema';

const MIGRATION = readFileSync(
  path.join(import.meta.dirname, '../../src/server/db/migrations/0030_drop_placeholder_legal_links.sql'),
  'utf8',
);
const run = async () => {
  for (const statement of MIGRATION.split('--> statement-breakpoint')) {
    if (statement.trim()) await db.execute(sql.raw(statement));
  }
};
const footer = async () => (await db.select().from(settings).where(eq(settings.key, 'footer')))[0]!;

const placeholders = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Login', href: '/login' },
];

beforeEach(async () => {
  await db.execute(sql`truncate table settings cascade`);
});

describe('drop placeholder legal links migration', () => {
  it('removes #privacy and #terms from the published and draft footer', async () => {
    await db.insert(settings).values({
      key: 'footer',
      value: { legalNote: 'x', legalLinks: placeholders },
      draft: { legalLinks: [...placeholders, { label: 'Careers', href: '/careers' }] },
    });
    await run();
    const row = await footer();
    expect(row.value).toEqual({ legalNote: 'x', legalLinks: [{ label: 'Login', href: '/login' }] });
    expect(row.draft).toEqual({
      legalLinks: [
        { label: 'Login', href: '/login' },
        { label: 'Careers', href: '/careers' },
      ],
    });
  });

  it('leaves a footer without legal links and other settings alone', async () => {
    await db.insert(settings).values([
      { key: 'footer', value: { legalNote: 'x' } },
      { key: 'navigation', value: { legalLinks: placeholders } },
    ]);
    await run();
    expect((await footer()).value).toEqual({ legalNote: 'x' });
    expect((await footer()).draft).toBeNull();
    const [nav] = await db.select().from(settings).where(eq(settings.key, 'navigation'));
    expect(nav!.value).toEqual({ legalLinks: placeholders });
  });
});
