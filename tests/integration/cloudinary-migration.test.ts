import { rm } from 'node:fs/promises';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import {
  enquiryPhotos,
  media,
  projectGalleryImages,
  projects,
  quoteRequests,
  revisions,
  services,
  settings,
  testimonials,
} from '@/server/db/schema';
import { CleanupRefused, cloudinaryCleanup, type CloudinaryAdminApi } from '@/server/lib/media/cloudinary-cleanup';
import {
  MigrationRefused,
  migrateCloudinaryMedia,
  publicIdFromUrl,
  verifyCloudinaryMigration,
} from '@/server/lib/media/cloudinary-migration';
import { resetStorageForTests } from '@/server/lib/media/storage';
import { PUBLIC_SETTINGS_KEYS } from '@/server/lib/settings/public-settings';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
}));

const UPLOAD_DIR = path.resolve('.test-uploads');
const CLOUD = 'demo';
const ref = (publicId: string) => ({ kind: 'cloudinary', publicId });

let jpeg: Buffer;
const MP4 = Buffer.concat([
  Buffer.from([0, 0, 0, 24]),
  Buffer.from('ftypisom'),
  Buffer.from([0, 0, 2, 0]),
  Buffer.from('isomiso2'),
  Buffer.alloc(64),
]);

// A fake Cloudinary: serves fixtures for every id except those in `missing`; no network.
const missing = new Set<string>();
const requested: string[] = [];
const fetchAsset = vi.fn(async (url: string) => {
  requested.push(url);
  if ([...missing].some((id) => url.includes(id))) return null;
  return url.includes('/video/') ? MP4 : jpeg;
});

async function seedSettings() {
  for (const key of PUBLIC_SETTINGS_KEYS) {
    const value =
      key === 'site'
        ? { logo: ref('vantage/site/logo') }
        : key === 'page.home'
          ? { hero: { video: ref('vantage/hero/clip') } }
          : {};
    await db.insert(settings).values({ key, value, version: 1 });
  }
}

async function seedContent() {
  const [service] = await db
    .insert(services)
    .values({ name: 'Dents', slug: 'dents', description: 'd', iconPublicId: 'vantage/services/icon' })
    .returning();
  const [project] = await db
    .insert(projects)
    .values({
      title: 'P',
      slug: 'p',
      vehicleModel: 'v',
      serviceCategory: 'c',
      description: 'd',
      beforeImagePublicId: 'vantage/projects/before',
      afterImagePublicId: 'vantage/projects/after',
    })
    .returning();
  await db.insert(projectGalleryImages).values({ projectId: project!.id, imagePublicId: 'vantage/projects/g1' });
  const [quote] = await db
    .insert(quoteRequests)
    .values({
      name: 'A',
      email: 'a@example.com',
      phone: '1',
      photoUrls: [`https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto/v12/vantage/quotes/photo1.jpg`],
    })
    .returning();
  return { service: service!, project: project!, quote: quote! };
}

beforeAll(async () => {
  jpeg = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#c33' } })
    .jpeg()
    .toBuffer();
  resetStorageForTests();
});
afterAll(() => rm(UPLOAD_DIR, { recursive: true, force: true }));
beforeEach(async () => {
  missing.clear();
  requested.length = 0;
  fetchAsset.mockClear();
  await db.execute(
    sql`truncate table media, services, projects, testimonials, quote_requests, contact_messages, settings, revisions, audit_logs cascade`,
  );
});

const run = (dryRun = false) => migrateCloudinaryMedia({ dryRun, cloudName: CLOUD, fetchAsset });

describe('publicIdFromUrl', () => {
  it('drops the version, transformations and extension', () => {
    expect(
      publicIdFromUrl('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v12/vantage/quotes/photo1.jpg'),
    ).toBe('vantage/quotes/photo1');
    expect(publicIdFromUrl('https://res.cloudinary.com/demo/image/upload/vantage/a')).toBe('vantage/a');
    expect(publicIdFromUrl('data:image/png;base64,AAAA')).toBeNull();
  });
});

describe('media:migrate', () => {
  it('refuses until every public settings key exists', async () => {
    await seedSettings();
    await db.delete(settings).where(eq(settings.key, 'page.home'));
    await expect(run()).rejects.toThrow(MigrationRefused);
    await expect(run()).rejects.toThrow('Run yarn settings:migrate first');
    expect(await db.select().from(media)).toHaveLength(0);
  });

  it('a dry run lists COPY lines and writes nothing', async () => {
    await seedSettings();
    await seedContent();
    const report = await run(true);
    expect(report.plan.every((l) => l.action === 'COPY')).toBe(true);
    expect(report.plan.map((l) => l.legacySource)).toContain('cloudinary:video:vantage/hero/clip');
    expect(await db.select().from(media)).toHaveLength(0);
    expect((await db.select().from(settings).where(eq(settings.key, 'site')))[0]?.version).toBe(1);
    expect(await db.select().from(enquiryPhotos)).toHaveLength(0);
  });

  it('copies every source, rewrites the data, and a second run reuses everything', async () => {
    await seedSettings();
    const { service, project, quote } = await seedContent();
    const first = await run();
    expect(first.failed).toEqual([]);
    expect(first.copied).toBe(first.refs);
    // 1 icon, before/after, 1 gallery image, logo, hero video, 1 quote photo
    expect(first.refs).toBe(7);

    const [icon] = await db.select().from(services).where(eq(services.id, service.id));
    expect(icon?.iconMediaId).toBeTruthy();
    expect(icon?.iconPublicId).toBe('vantage/services/icon'); // legacy id stays
    const [p] = await db.select().from(projects).where(eq(projects.id, project.id));
    expect(p?.beforeImageMediaId && p?.afterImageMediaId).toBeTruthy();
    const [gallery] = await db.select().from(projectGalleryImages);
    expect(gallery?.mediaId).toBeTruthy();

    const [site] = await db.select().from(settings).where(eq(settings.key, 'site'));
    expect(site?.version).toBe(2);
    expect((site?.value as { logo: { kind: string } }).logo.kind).toBe('media');
    const [home] = await db.select().from(settings).where(eq(settings.key, 'page.home'));
    const heroVideo = (home?.value as { hero: { video: { kind: string; id: string } } }).hero.video;
    expect(heroVideo.kind).toBe('media');
    const [videoRow] = await db.select().from(media).where(eq(media.id, heroVideo.id));
    expect(videoRow?.mimeType).toBe('video/mp4');
    const notes = (await db.select().from(revisions).where(eq(revisions.entityId, 'site'))).map((r) => r.note);
    expect(notes).toContain('Media moved to R2');

    const links = await db.select().from(enquiryPhotos);
    expect(links).toHaveLength(1);
    expect(links[0]?.quoteRequestId).toBe(quote.id);
    const [photo] = await db.select().from(media).where(eq(media.id, links[0]!.mediaId));
    expect(photo?.scope).toBe('enquiry');

    const rows = (await db.select().from(media)).length;
    const second = await run();
    // Only the quote photo URL is still a legacy string; its file is reused, nothing is copied.
    expect([second.refs, second.copied, second.reused]).toEqual([1, 0, 1]);
    expect(second.rewritten).toEqual({ columns: 0, settings: [], enquiryPhotos: 0 });
    expect((await db.select().from(media)).length).toBe(rows);
    expect(await db.select().from(enquiryPhotos)).toHaveLength(1);
    expect((await verifyCloudinaryMigration()).problems).toEqual([]);
  });

  it('reports a missing asset and leaves its reference unchanged; verify fails until it is served', async () => {
    await seedSettings();
    await seedContent();
    missing.add('vantage/site/logo');
    const report = await run();
    expect(report.missing).toEqual(['cloudinary:image:vantage/site/logo']);
    const [site] = await db.select().from(settings).where(eq(settings.key, 'site'));
    expect(site?.version).toBe(1);
    expect((site?.value as { logo: { kind: string } }).logo.kind).toBe('cloudinary');

    const bad = await verifyCloudinaryMigration();
    expect(bad.ok).toBe(false);
    expect(bad.problems).toContain('UNMIGRATED settings site vantage/site/logo');

    missing.clear();
    const again = await run();
    expect(again.copied).toBe(1);
    expect((await verifyCloudinaryMigration()).ok).toBe(true);
  });

  it('never relinks to a media row that was deleted in the library', async () => {
    await seedSettings();
    const { service } = await seedContent();
    await run();
    // Delete the migrated icon in the library, then point the service back at its legacy id.
    await db
      .update(media)
      .set({ deletedAt: new Date() })
      .where(eq(media.legacySource, 'cloudinary:image:vantage/services/icon'));
    await db.update(services).set({ iconMediaId: null }).where(eq(services.id, service.id));
    const report = await run();
    expect(report.plan.some((l) => l.action === 'BLOCKED')).toBe(true);
    expect(report.failed.join()).toContain('was deleted in the library');
    const [row] = await db.select().from(services).where(eq(services.id, service.id));
    expect(row?.iconMediaId).toBeNull();
  });

  it('frames a testimonial avatar on the most interesting part of the image', async () => {
    await seedSettings();
    await db
      .insert(testimonials)
      .values({ customerName: 'N', rating: 5, reviewText: 'r', avatarPublicId: 'vantage/av/face' });
    // Grey picture with one sharp, colourful block at the far right.
    const base = await sharp({ create: { width: 400, height: 200, channels: 3, background: '#808080' } })
      .composite([
        {
          input: await sharp({ create: { width: 60, height: 60, channels: 3, background: '#ff0000' } })
            .png()
            .toBuffer(),
          left: 330,
          top: 70,
        },
      ])
      .jpeg()
      .toBuffer();
    await migrateCloudinaryMedia({ dryRun: false, cloudName: CLOUD, fetchAsset: async () => base });
    const [row] = await db.select().from(media).where(eq(media.legacySource, 'cloudinary:image:vantage/av/face'));
    expect(row?.focalX).toBeGreaterThan(0.5);
    expect(row!.focalX).toBeLessThanOrEqual(1);
    expect(row!.focalY).toBeGreaterThanOrEqual(0);
  });

  it('verify reports a migrated file that can no longer be read', async () => {
    await seedSettings();
    await seedContent();
    await run();
    await db
      .update(media)
      .set({ key: 'vantage/media/2026/01/0123456789abcdef-gone.png' })
      .where(eq(media.scope, 'enquiry'));
    const result = await verifyCloudinaryMigration();
    expect(result.problems.some((p) => p.startsWith('UNREADABLE '))).toBe(true);
  });
});

describe('media:cloudinary-cleanup', () => {
  const api = (ids: Record<string, string[]>) => {
    const removed: string[] = [];
    const client: CloudinaryAdminApi = {
      list: async (resource) => ({ ids: ids[resource] ?? [] }),
      remove: async (_resource, batch) => void removed.push(...batch),
    };
    return { client, removed };
  };

  it('dry run counts per folder and deletes nothing, without needing verify', async () => {
    const { client, removed } = api({
      image: ['vantage/a/1', 'vantage/a/2', 'other/x', 'vantage/b/3'],
      video: ['vantage/v/1'],
    });
    const report = await cloudinaryCleanup({
      del: false,
      api: client,
      verify: async () => {
        throw new Error('not called');
      },
    });
    expect(report.folders).toEqual({
      'vantage/a': { image: 2, video: 0 },
      'vantage/b': { image: 1, video: 0 },
      'vantage/v': { image: 0, video: 1 },
    });
    expect(report.total).toBe(4); // 'other/x' is outside the prefix
    expect(removed).toEqual([]);
  });

  it('refuses --delete while the migration does not verify, and deletes in batches after it does', async () => {
    const many = Array.from({ length: 250 }, (_, i) => `vantage/m/${i}`);
    const { client, removed } = api({ image: many });
    await expect(
      cloudinaryCleanup({ del: true, api: client, verify: async () => ({ ok: false, problems: ['UNMIGRATED x'] }) }),
    ).rejects.toThrow(CleanupRefused);
    expect(removed).toEqual([]);
    const batches: number[] = [];
    const counting: CloudinaryAdminApi = { ...client, remove: async (_r, b) => void batches.push(b.length) };
    const report = await cloudinaryCleanup({
      del: true,
      api: counting,
      verify: async () => ({ ok: true, problems: [] }),
    });
    expect(batches).toEqual([100, 100, 50]);
    expect(report.removed).toBe(250);
  });
});
