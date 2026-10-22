import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/server/db';
import { adminUsers, enquiryPhotos, media, quoteRequests, services, settings, users } from '@/server/db/schema';
import { legacyCheck } from '@/server/lib/legacy/legacy-check';
import { PUBLIC_SETTINGS_KEYS } from '@/server/lib/settings/public-settings';

const PHOTO = 'https://res.cloudinary.com/x/image/upload/v1/a.jpg';

const wipe = () =>
  db.execute(
    sql`truncate table media, services, quote_requests, settings, admin_users, users, enquiry_photos cascade`,
  );

async function seedSettings() {
  for (const key of PUBLIC_SETTINGS_KEYS) await db.insert(settings).values({ key, value: {}, version: 1 });
}

const countOf = async (label: string) => (await legacyCheck()).items.find((i) => i.label === label)?.count;

const quote = (extra: Partial<typeof quoteRequests.$inferInsert> = {}) =>
  db
    .insert(quoteRequests)
    .values({ name: 'N', email: 'n@x.test', phone: '1', message: 'm', ...extra } as typeof quoteRequests.$inferInsert)
    .returning()
    .then((r) => r[0]!);

describe('legacyCheck', () => {
  beforeEach(async () => {
    await wipe();
    await seedSettings();
  });

  it('is OK with every count at zero on a migrated database', async () => {
    const result = await legacyCheck();
    expect(result.ok).toBe(true);
    expect(result.items.every((i) => i.count === 0)).toBe(true);
  });

  it('counts a content row with a legacy id and no media id', async () => {
    await db.insert(services).values({ name: 'Dents', slug: 'dents', description: 'd', iconPublicId: 'a/b' });
    const result = await legacyCheck();
    expect(result.ok).toBe(false);
    expect(await countOf('services.icon')).toBe(1);
    expect(await countOf('services.image')).toBe(0);
  });

  it('counts unlinked enquiry photos, and stops counting once linked', async () => {
    const q = await quote({ photoUrls: [PHOTO] });
    expect(await countOf('enquiry photos not linked')).toBe(1);

    const [m] = await db
      .insert(media)
      .values({
        driver: 'local',
        key: 'enquiry/a.jpg',
        scope: 'enquiry',
        legacySource: 'cloudinary:image:a',
        url: '/uploads/a.jpg',
        filename: 'a.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1,
      })
      .returning();
    await db.insert(enquiryPhotos).values({ quoteRequestId: q.id, mediaId: m!.id, position: 0 });
    expect(await countOf('enquiry photos not linked')).toBe(0);
  });

  it('counts a missing settings key', async () => {
    await db.delete(settings).where(eq(settings.key, 'contact'));
    expect(await countOf('settings keys missing')).toBe(1);
    expect((await legacyCheck()).ok).toBe(false);
  });

  it('counts settings that still hold a Cloudinary image', async () => {
    await db
      .update(settings)
      .set({ value: { logo: { kind: 'cloudinary', publicId: 'x' } } })
      .where(eq(settings.key, 'site'));
    expect(await countOf('settings with Cloudinary images')).toBe(1);
  });

  it('counts quotes assigned only to a legacy admin', async () => {
    const [admin] = await db
      .insert(adminUsers)
      .values({ email: 'a@x.test', passwordHash: 'h', name: 'A' })
      .returning();
    await quote({ assignedAdminId: admin!.id });
    expect(await countOf('quotes assigned only to legacy admins')).toBe(1);
  });

  it('counts active admins without a user, ignoring case and inactive admins', async () => {
    await db.insert(adminUsers).values([
      { email: 'Ann@X.test', passwordHash: 'h', name: 'Ann' },
      { email: 'bob@x.test', passwordHash: 'h', name: 'Bob', isActive: false },
      { email: 'cy@x.test', passwordHash: 'h', name: 'Cy' },
    ]);
    await db.insert(users).values({ id: 'u1', name: 'Ann', email: 'ann@x.test', emailVerified: true });
    expect(await countOf('admin accounts not migrated')).toBe(1);
  });
});
