import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MEDIA_TAG } from '@/lib/cache/media-tag';
import { db } from '@/server/db';
import {
  homepageCatalogs,
  media,
  partnerLogos,
  projectGalleryImages,
  services,
  testimonials,
} from '@/server/db/schema';
import { ApiError } from '@/server/lib/errors';
import { homepageCatalogRepository } from '@/server/repositories/homepage-catalog-repository';
import { partnerLogoRepository } from '@/server/repositories/partner-logo-repository';
import { projectRepository } from '@/server/repositories/project-repository';
import { serviceRepository } from '@/server/repositories/service-repository';
import { testimonialRepository } from '@/server/repositories/testimonial-repository';
import { homepageCatalogService } from '@/server/services/homepage-catalog-service';
import { partnerLogoService } from '@/server/services/partner-logo-service';
import { projectService, SYSTEM_ACTOR } from '@/server/services/project-service';
import { serviceService } from '@/server/services/service-service';
import { testimonialService } from '@/server/services/testimonial-service';
import { call, sessionCookie } from '../support/session';
import { createPartnerLogoSchema, updatePartnerLogoSchema } from '@/validations/partner-logo-schema';
import { createProjectSchema, updateProjectSchema } from '@/validations/project-schema';

const cacheTag = vi.hoisted(() => vi.fn());
vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheTag,
  cacheLife: vi.fn(),
  revalidateTag: vi.fn(),
}));

let n = 0;
async function insertMedia(over: Partial<typeof media.$inferInsert> = {}) {
  n += 1;
  const [row] = await db
    .insert(media)
    .values({
      driver: 'local',
      key: `vantage/media/2026/10/${String(n).padStart(16, '0')}-c.png`,
      url: `/uploads/vantage/media/2026/10/${String(n).padStart(16, '0')}-c.png`,
      filename: 'c.png',
      mimeType: 'image/png',
      sizeBytes: 1,
      alt: 'first alt',
      focalX: 0.25,
      focalY: 0.75,
      ...over,
    })
    .returning();
  return row!;
}

const service = (over: Record<string, unknown> = {}) => ({
  name: 'Dents',
  slug: `dents-${Math.random().toString(36).slice(2, 8)}`,
  description: 'd',
  ...over,
});

const project = (over: Record<string, unknown> = {}) => ({
  title: 'Civic',
  slug: `civic-${Math.random().toString(36).slice(2, 8)}`,
  vehicleModel: 'Civic',
  serviceCategory: 'Paint',
  description: 'd',
  isFeatured: false,
  status: 'published' as const,
  ...over,
});

beforeEach(async () => {
  cacheTag.mockClear();
  await db.execute(
    sql`truncate table media, services, projects, partner_logos, testimonials, homepage_catalogs cascade`,
  );
});

describe('services', () => {
  it('resolves a live icon and keeps the media id', async () => {
    const icon = await insertMedia();
    const created = await serviceService.create(service({ iconMediaId: icon.id }));
    expect(created?.iconMediaId).toBe(icon.id);
    const [listed] = await serviceRepository.listPublished();
    expect(listed?.icon).toMatchObject({ id: icon.id, src: icon.url, focal: { x: 0.25, y: 0.75 } });
    expect(listed?.image).toBeNull();
  });

  it('refuses a soft-deleted or unknown media id with 422 _media', async () => {
    const gone = await insertMedia({ deletedAt: new Date() });
    const error = await serviceService.create(service({ iconMediaId: gone.id })).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).causes?._media).toEqual([`Image ${gone.id} no longer exists`]);
    expect(await db.select().from(services)).toHaveLength(0);
  });

  it('refuses an enquiry-scope media id with 422 _media', async () => {
    const lead = await insertMedia({ scope: 'enquiry' });
    const error = await serviceService.create(service({ iconMediaId: lead.id })).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).causes?._media).toEqual([`Image ${lead.id} no longer exists`]);
  });

  it('falls back to the legacy Cloudinary URL for a legacy-only row', async () => {
    await db.insert(services).values({ ...service(), iconPublicId: 'vantage/legacy-icon' });
    const [listed] = await serviceRepository.listPublished();
    expect(listed?.icon).toMatchObject({
      id: null,
      src: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/vantage/legacy-icon',
    });
  });

  it('clearing the media id on a legacy row removes the image for good', async () => {
    const [row] = await db
      .insert(services)
      .values({ ...service(), iconPublicId: 'vantage/legacy-icon' })
      .returning();
    const updated = await serviceService.update(row!.id, { iconMediaId: null });
    expect(updated?.icon).toBeNull();
    const [stored] = await db.select().from(services).where(eq(services.id, row!.id));
    expect(stored?.iconPublicId).toBeNull();
    expect(stored?.iconMediaId).toBeNull();
    expect((await serviceRepository.listPublished())[0]?.icon).toBeNull();
  });

  it('leaves the legacy image alone when the media key is not written', async () => {
    const [row] = await db
      .insert(services)
      .values({ ...service(), iconPublicId: 'vantage/legacy-icon' })
      .returning();
    const updated = await serviceService.update(row!.id, { name: 'Renamed' });
    expect(updated?.icon?.src).toContain('vantage/legacy-icon');
  });

  it('tags public reads with the media tag and shows alt changes', async () => {
    const icon = await insertMedia();
    await serviceService.create(service({ iconMediaId: icon.id }));
    await serviceService.listPublished();
    expect(cacheTag).toHaveBeenCalledWith(MEDIA_TAG);
    await db.update(media).set({ alt: 'new alt', isDecorative: false }).where(eq(media.id, icon.id));
    expect((await serviceRepository.listPublished())[0]?.icon?.alt).toBe('new alt');
  });
});

describe('projects', () => {
  it('keeps the order of three gallery ids and resolves before/after', async () => {
    const [before, after, g1, g2, g3] = await Promise.all([1, 2, 3, 4, 5].map(() => insertMedia()));
    const created = await projectService.create(
      {
        ...project(),
        beforeImageMediaId: before!.id,
        afterImageMediaId: after!.id,
        galleryMediaIds: [g3!.id, g1!.id, g2!.id],
      },
      SYSTEM_ACTOR,
    );
    expect(created?.beforeImage?.src).toBe(before!.url);
    expect(created?.afterImage?.src).toBe(after!.url);
    expect(created?.gallery.map((g) => g.id)).toEqual([g3!.id, g1!.id, g2!.id]);
    const rows = await db.select().from(projectGalleryImages);
    expect(rows.every((r) => r.imagePublicId === null && r.mediaId)).toBe(true);
  });

  it('mixes legacy and media gallery rows on read and drops empty ones', async () => {
    const [before, after, g1] = await Promise.all([1, 2, 3].map(() => insertMedia()));
    const created = await projectService.create(
      {
        ...project(),
        beforeImageMediaId: before!.id,
        afterImageMediaId: after!.id,
      },
      SYSTEM_ACTOR,
    );
    await db.insert(projectGalleryImages).values([
      { projectId: created!.id, imagePublicId: 'vantage/old', displayOrder: 0 },
      { projectId: created!.id, mediaId: g1!.id, displayOrder: 1 },
      { projectId: created!.id, displayOrder: 2 },
    ]);
    const found = await projectRepository.byId(created!.id);
    expect(found?.gallery.map((g) => g.src)).toEqual([
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/vantage/old',
      g1!.url,
    ]);
  });

  it('requires a before and an after media id', () => {
    const id = '5c1b0f1e-3b49-4f5e-8a53-1a0c2b9d7e11';
    expect(createProjectSchema.safeParse(project()).success).toBe(false);
    expect(createProjectSchema.safeParse(project({ beforeImageMediaId: id })).success).toBe(false);
    expect(createProjectSchema.safeParse(project({ beforeImageMediaId: id, afterImageMediaId: id })).success).toBe(
      true,
    );
    // legacy ids are no longer accepted as input
    expect(createProjectSchema.safeParse(project({ beforeImagePublicId: 'x', afterImagePublicId: 'y' })).success).toBe(
      false,
    );
  });

  it('refuses to replace a gallery that still has legacy rows; an all-media gallery can be reordered', async () => {
    const [before, after, g1, g2] = await Promise.all([1, 2, 3, 4].map(() => insertMedia()));
    const created = await projectService.create(
      {
        ...project(),
        beforeImageMediaId: before!.id,
        afterImageMediaId: after!.id,
        galleryMediaIds: [g1!.id, g2!.id],
      },
      SYSTEM_ACTOR,
    );
    // all-media gallery: reorder and shrink are fine
    await projectService.update(created!.id, { galleryMediaIds: [g2!.id, g1!.id] }, SYSTEM_ACTOR);
    expect((await projectRepository.byId(created!.id))?.gallery.map((g) => g.id)).toEqual([g2!.id, g1!.id]);
    // a legacy row makes the whole gallery read-only
    await db
      .insert(projectGalleryImages)
      .values({ projectId: created!.id, imagePublicId: 'vantage/old', displayOrder: 2 });
    await projectService.update(created!.id, { title: 'Renamed' }, SYSTEM_ACTOR);
    await expect(projectService.update(created!.id, { galleryMediaIds: [g1!.id] }, SYSTEM_ACTOR)).rejects.toMatchObject(
      {
        status: 409,
        message: 'Migrate this gallery first',
      },
    );
    const found = await projectRepository.byId(created!.id);
    expect(found?.galleryImages.map((g) => g.mediaId)).toEqual([g2!.id, g1!.id, null]);
    expect(found?.galleryImages[2]?.imagePublicId).toBe('vantage/old');
  });

  it('cannot clear a required image on update, and an update may leave it out', () => {
    expect(updateProjectSchema.safeParse({ beforeImageMediaId: null }).success).toBe(false);
    expect(updateProjectSchema.safeParse({ afterImageMediaId: null }).success).toBe(false);
    expect(updatePartnerLogoSchema.safeParse({ logoMediaId: null }).success).toBe(false);
    expect(updateProjectSchema.safeParse({ title: 'x' }).success).toBe(true);
    expect(updatePartnerLogoSchema.safeParse({ companyName: 'x' }).success).toBe(true);
  });

  it('refuses a deleted gallery id', async () => {
    const [before, after] = await Promise.all([1, 2].map(() => insertMedia()));
    const gone = await insertMedia({ deletedAt: new Date() });
    await expect(
      projectService.create(
        {
          ...project(),
          beforeImageMediaId: before!.id,
          afterImageMediaId: after!.id,
          galleryMediaIds: [gone.id],
        },
        SYSTEM_ACTOR,
      ),
    ).rejects.toMatchObject({ status: 422 });
  });
});

describe('partner logos', () => {
  it('needs a logo media id (422 on the API path)', async () => {
    const result = createPartnerLogoSchema.safeParse({ companyName: 'A' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['logoMediaId']);
    expect(createPartnerLogoSchema.safeParse({ companyName: 'A', logoPublicId: 'x' }).success).toBe(false);
    const cookie = await sessionCookie('owner');
    const res = await call('/partner-logos', cookie, { method: 'POST', body: { companyName: 'A' } });
    expect(res.status).toBe(422);
    expect(
      ((await res.json()) as { error: { causes: Record<string, string[]> } }).error.causes.logoMediaId,
    ).toBeTruthy();
  });

  it('resolves the logo from a media row; a row with neither id reads null', async () => {
    const logo = await insertMedia();
    await partnerLogoService.create({ companyName: 'A', websiteUrl: null, logoMediaId: logo.id });
    await db.insert(partnerLogos).values({ companyName: 'B', displayOrder: 5 });
    const rows = await partnerLogoRepository.listEnabled();
    expect(rows.map((r) => r.logo?.src ?? null)).toEqual([logo.url, null]);
  });
});

describe('catalogs and testimonials', () => {
  it('resolves a catalog icon image and keeps the icon name', async () => {
    const icon = await insertMedia();
    await homepageCatalogService.create({
      title: 'T',
      description: 'd',
      footnote: 'f',
      icon: 'wrench',
      iconMediaId: icon.id,
    });
    const [row] = await homepageCatalogRepository.listEnabled();
    expect(row?.icon).toBe('wrench');
    expect(row?.iconImage?.src).toBe(icon.url);
  });

  it('resolves a testimonial avatar and clears a legacy one', async () => {
    const [row] = await db
      .insert(testimonials)
      .values({ customerName: 'N', rating: 5, reviewText: 'r', avatarPublicId: 'vantage/av' })
      .returning();
    expect((await testimonialRepository.byId(row!.id))?.avatar?.src).toContain('vantage/av');
    const avatar = await insertMedia();
    const updated = await testimonialService.update(row!.id, { avatarMediaId: avatar.id });
    expect(updated?.avatar?.src).toBe(avatar.url);
    const [stored] = await db.select().from(testimonials).where(eq(testimonials.id, row!.id));
    expect(stored?.avatarPublicId).toBeNull();
  });
});

describe('API contract', () => {
  it.each([
    ['/services', { name: 'S', slug: 's', description: 'd', iconPublicId: 'x' }, 'iconPublicId'],
    ['/services', { name: 'S', slug: 's2', description: 'd', imagePublicId: 'x' }, 'imagePublicId'],
    ['/homepage-catalogs', { title: 'T', description: 'd', iconPublicId: 'x' }, 'iconPublicId'],
    ['/testimonials', { customerName: 'N', rating: 5, reviewText: 'r', avatarPublicId: 'x' }, 'avatarPublicId'],
    [
      '/partner-logos',
      { companyName: 'A', logoMediaId: '5c1b0f1e-3b49-4f5e-8a53-1a0c2b9d7e11', logoPublicId: 'x' },
      'logoPublicId',
    ],
    ['/projects', { ...project(), beforeImagePublicId: 'x' }, 'beforeImagePublicId'],
    ['/projects', { ...project(), galleryImagePublicIds: ['x'] }, 'galleryImagePublicIds'],
  ])('%s refuses the legacy key %s with a 422 and a clear message', async (path, body, key) => {
    const cookie = await sessionCookie('owner');
    const res = await call(path, cookie, { method: 'POST', body });
    expect(res.status).toBe(422);
    const { error } = (await res.json()) as { error: { causes: Record<string, string[]> } };
    expect(error.causes[key]?.[0]).toMatch(/no longer accepted/);
  });

  it('a PATCH that leaves isFeatured out keeps it (projects and testimonials)', async () => {
    const cookie = await sessionCookie('owner');
    const [before, after] = await Promise.all([1, 2].map(() => insertMedia()));
    const p = await projectService.create(
      {
        ...project(),
        isFeatured: true,
        beforeImageMediaId: before!.id,
        afterImageMediaId: after!.id,
      },
      SYSTEM_ACTOR,
    );
    const res = await call(`/projects/${p!.id}`, cookie, { method: 'PATCH', body: { title: 'Only the title' } });
    expect(res.status).toBe(200);
    expect((await projectRepository.byId(p!.id))?.isFeatured).toBe(true);
    const [t] = await db
      .insert(testimonials)
      .values({ customerName: 'N', rating: 5, reviewText: 'r', isFeatured: true })
      .returning();
    const res2 = await call(`/testimonials/${t!.id}`, cookie, { method: 'PATCH', body: { reviewText: 'new' } });
    expect(res2.status).toBe(200);
    expect((await testimonialRepository.byId(t!.id))?.isFeatured).toBe(true);
    const [c] = await db
      .insert(homepageCatalogs)
      .values({ title: 'T', description: 'd', icon: 'wrench', footnote: 'Custom note' })
      .returning();
    const res3 = await call(`/homepage-catalogs/${c!.id}`, cookie, { method: 'PATCH', body: { title: 'T2' } });
    expect(res3.status).toBe(200);
    const after3 = await homepageCatalogRepository.byId(c!.id);
    expect([after3?.icon, after3?.footnote]).toEqual(['wrench', 'Custom note']);
  });
});
