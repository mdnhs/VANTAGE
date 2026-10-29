import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import {
  enquiryPhotos,
  homepageCatalogs,
  legalPages,
  media,
  partnerLogos,
  projectGalleryImages,
  projects,
  quoteRequests,
  services,
  settings,
  testimonials,
} from '@/server/db/schema';
import { ApiError } from '@/server/lib/errors';
import { assertMediaExists } from '@/server/lib/media/assert-media';
import { loadPublicImages } from '@/server/lib/media/resolve';
import { mediaUsage } from '@/server/lib/media/usage';

// `'use cache'` has no runtime outside Next: the cache hooks become no-ops.
vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

let n = 0;
async function insertMedia(deletedAt: Date | null = null, scope: 'library' | 'enquiry' = 'library') {
  n += 1;
  const [row] = await db
    .insert(media)
    .values({
      driver: 'local',
      key: `vantage/media/2026/10/${String(n).padStart(16, '0')}-t.png`,
      url: `/uploads/t${n}.png`,
      filename: 't.png',
      mimeType: 'image/png',
      sizeBytes: 1,
      deletedAt,
      scope,
    })
    .returning();
  return row!;
}

beforeEach(async () => {
  await db.execute(
    sql`truncate table media, services, projects, partner_logos, testimonials, homepage_catalogs, quote_requests, settings, legal_pages cascade`,
  );
});

describe('mediaUsage', () => {
  it('is empty for an unreferenced file', async () => {
    const row = await insertMedia();
    expect(await mediaUsage(db, row.id)).toEqual([]);
  });

  it('finds a settings value', async () => {
    const row = await insertMedia();
    await db.insert(settings).values({ key: 'navigation', value: { logo: row.id } });
    expect(await mediaUsage(db, row.id)).toEqual([
      { kind: 'setting', id: 'navigation', label: 'Navigation', href: '/dashboard/settings/navigation' },
    ]);
  });

  it('finds a service icon', async () => {
    const row = await insertMedia();
    const [service] = await db
      .insert(services)
      .values({ name: 'Dents', slug: 'dents', description: 'd', iconMediaId: row.id })
      .returning();
    expect(await mediaUsage(db, row.id)).toEqual([
      { kind: 'content', id: service!.id, label: 'Service "Dents"', href: '/dashboard/services' },
    ]);
  });

  it('finds a service image, project before/after, partner logo, catalog icon and avatar', async () => {
    const row = await insertMedia();
    const [service] = await db
      .insert(services)
      .values({ name: 'Paint', slug: 'paint', description: 'd', imageMediaId: row.id })
      .returning();
    const [project] = await db
      .insert(projects)
      .values({
        title: 'BMW',
        slug: 'bmw',
        vehicleModel: 'M3',
        serviceCategory: 'Paint',
        description: 'd',
        beforeImageMediaId: row.id,
        afterImageMediaId: row.id,
      })
      .returning();
    const [logo] = await db.insert(partnerLogos).values({ companyName: 'Aviva', logoMediaId: row.id }).returning();
    const [catalog] = await db
      .insert(homepageCatalogs)
      .values({ title: 'Card', description: 'd', iconMediaId: row.id })
      .returning();
    const [testimonial] = await db
      .insert(testimonials)
      .values({ customerName: 'Sam', rating: 5, reviewText: 'r', avatarMediaId: row.id })
      .returning();
    const uses = await mediaUsage(db, row.id);
    expect(uses.every((u) => u.kind === 'content')).toBe(true);
    expect(uses).toEqual(
      expect.arrayContaining([
        { kind: 'content', id: service!.id, label: 'Service "Paint"', href: '/dashboard/services' },
        { kind: 'content', id: project!.id, label: 'Project "BMW"', href: '/dashboard/projects' },
        { kind: 'content', id: logo!.id, label: 'Partner logo "Aviva"', href: '/dashboard/partner-logos' },
        { kind: 'content', id: catalog!.id, label: 'Catalog card "Card"', href: '/dashboard/homepage-catalogs' },
        { kind: 'content', id: testimonial!.id, label: 'Testimonial "Sam"', href: '/dashboard/testimonials' },
      ]),
    );
    expect(uses).toHaveLength(5);
  });

  it('finds a share image on a service, a project and a legal page', async () => {
    const row = await insertMedia();
    await db.insert(services).values({ name: 'Respray', slug: 'respray', description: 'd', ogImageMediaId: row.id });
    await db.insert(legalPages).values({
      title: 'Privacy',
      slug: 'privacy',
      content: { type: 'doc', content: [] },
      ogImageMediaId: row.id,
    });
    const uses = await mediaUsage(db, row.id);
    expect(uses.map((u) => u.label).sort()).toEqual(['Legal page "Privacy"', 'Service "Respray"']);
    expect(uses.find((u) => u.label.startsWith('Legal'))?.href).toBe('/dashboard/legal-pages');
  });

  it('finds a project gallery image', async () => {
    const row = await insertMedia();
    const [project] = await db
      .insert(projects)
      .values({ title: 'Civic', slug: 'civic', vehicleModel: 'Civic', serviceCategory: 'Paint', description: 'd' })
      .returning();
    await db.insert(projectGalleryImages).values({ projectId: project!.id, mediaId: row.id });
    expect(await mediaUsage(db, row.id)).toEqual([
      { kind: 'content', id: project!.id, label: 'Project gallery "Civic"', href: '/dashboard/projects' },
    ]);
  });

  it('finds an enquiry photo with the lead href', async () => {
    const row = await insertMedia();
    const [quote] = await db
      .insert(quoteRequests)
      .values({ name: 'A', email: 'a@example.com', phone: '1' })
      .returning();
    await db.insert(enquiryPhotos).values({ quoteRequestId: quote!.id, mediaId: row.id, position: 0 });
    expect(await mediaUsage(db, row.id)).toEqual([
      {
        kind: 'enquiry',
        id: quote!.id,
        label: 'Quote request photo',
        href: `/dashboard/quotes/${quote!.id}`,
      },
    ]);
  });
});

describe('assertMediaExists', () => {
  it('resolves for live ids and for no ids', async () => {
    const row = await insertMedia();
    await expect(assertMediaExists([row.id, row.id])).resolves.toBeUndefined();
    await expect(assertMediaExists([])).resolves.toBeUndefined();
  });

  it('rejects enquiry-scoped uploads', async () => {
    const photo = await insertMedia(null, 'enquiry');
    const error = await assertMediaExists([photo.id]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).causes?._media).toEqual([`Image ${photo.id} no longer exists`]);
  });

  it('lists a soft-deleted, a random and a malformed id with a 422', async () => {
    const gone = await insertMedia(new Date());
    const random = '5c1b0f1e-3b49-4f5e-8a53-1a0c2b9d7e11';
    const error = await assertMediaExists([gone.id, random, 'nope']).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    const api = error as ApiError;
    expect(api.status).toBe(422);
    expect(api.code).toBe('VALIDATION_ERROR');
    expect(api.message).toBe('Some images were deleted. Choose new ones before saving.');
    expect(api.causes?._media).toEqual([
      `Image ${gone.id} no longer exists`,
      `Image ${random} no longer exists`,
      'Image nope no longer exists',
    ]);
  });
});

describe('loadPublicImages', () => {
  it('drops malformed ids instead of failing the query', async () => {
    const row = await insertMedia();
    const out = await loadPublicImages([row.id, 'not-a-uuid', '', row.id.toUpperCase()]);
    expect(Object.keys(out)).toEqual([row.id]);
    expect(out[row.id]?.src).toBe(row.url);
    await expect(loadPublicImages(['nope'])).resolves.toEqual({});
  });
});
