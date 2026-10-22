import 'server-only';

import { stat } from 'node:fs/promises';

import { and, eq, isNotNull, isNull, like } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import sharp from 'sharp';

import { mapRefs } from '@/lib/content/image-ref';
import { db } from '@/server/db';
import {
  contactMessages,
  enquiryPhotos,
  homepageCatalogs,
  media,
  partnerLogos,
  projectGalleryImages,
  projects,
  quoteRequests,
  services,
  settings,
  testimonials,
} from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import { ApiError } from '@/server/lib/errors';
import { MAX_VIDEO_BYTES } from '@/server/lib/media/process';
import { localFile } from '@/server/lib/media/storage';
import { PUBLIC_SETTINGS_KEYS } from '@/server/lib/settings/public-settings';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { DeletedLegacySourceError, mediaLibraryService } from '@/server/services/media-library-service';

export const MIGRATION_NOTE = 'Media moved to R2';

export class MigrationRefused extends Error {}

type Resource = 'image' | 'video';
type Scope = 'library' | 'enquiry';
type Ref = { publicId: string; resource: Resource; face: boolean; scope: Scope; where: string };

export type PlanLine = {
  action: 'COPY' | 'REUSE' | 'MISSING' | 'FAILED' | 'BLOCKED';
  source: string;
  legacySource: string;
};

export type MigrationReport = {
  refs: number;
  copied: number;
  reused: number;
  missing: string[];
  failed: string[];
  plan: PlanLine[];
  rewritten: { columns: number; settings: string[]; enquiryPhotos: number };
};

export type FetchAsset = (url: string) => Promise<Buffer | null>;

export const legacySourceOf = (resource: Resource, publicId: string) => `cloudinary:${resource}:${publicId}`;

// publicId from a Cloudinary delivery URL: whatever follows /upload/, minus transformation
// segments (f_auto,q_auto / w_100 / v123) and a trailing image extension.
export function publicIdFromUrl(url: string): string | null {
  const match = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(.+)$/.exec(url.split(/[?#]/)[0] ?? '');
  if (!match) return null;
  const segments = match[1]!.split('/');
  while (segments.length > 1 && /^(v\d+|([a-z]{1,4}_[^,/]*)(,[a-z]{1,4}_[^,/]*)*)$/i.test(segments[0]!))
    segments.shift();
  const id = segments.join('/').replace(/\.[a-z0-9]{2,5}$/i, '');
  return id || null;
}

// The default downloader: 60 s timeout, 100 MB cap, null for a 404.
export const defaultFetchAsset: FetchAsset = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length'));
  if (declared > MAX_VIDEO_BYTES) throw new Error('over the 100 MB cap');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_VIDEO_BYTES) throw new Error('over the 100 MB cap');
  return bytes;
};

type Def = { label: string; table: PgTable; legacy: PgColumn; mediaCol: PgColumn; mediaKey: string; face?: boolean };

// The content columns that hold a Cloudinary id beside a media id (migration 0024).
const DEFS: Def[] = [
  {
    label: 'services.icon',
    table: services,
    legacy: services.iconPublicId,
    mediaCol: services.iconMediaId,
    mediaKey: 'iconMediaId',
  },
  {
    label: 'services.image',
    table: services,
    legacy: services.imagePublicId,
    mediaCol: services.imageMediaId,
    mediaKey: 'imageMediaId',
  },
  {
    label: 'homepage_catalogs.icon',
    table: homepageCatalogs,
    legacy: homepageCatalogs.iconPublicId,
    mediaCol: homepageCatalogs.iconMediaId,
    mediaKey: 'iconMediaId',
  },
  {
    label: 'partner_logos.logo',
    table: partnerLogos,
    legacy: partnerLogos.logoPublicId,
    mediaCol: partnerLogos.logoMediaId,
    mediaKey: 'logoMediaId',
  },
  {
    label: 'projects.before',
    table: projects,
    legacy: projects.beforeImagePublicId,
    mediaCol: projects.beforeImageMediaId,
    mediaKey: 'beforeImageMediaId',
  },
  {
    label: 'projects.after',
    table: projects,
    legacy: projects.afterImagePublicId,
    mediaCol: projects.afterImageMediaId,
    mediaKey: 'afterImageMediaId',
  },
  {
    label: 'testimonials.avatar',
    table: testimonials,
    legacy: testimonials.avatarPublicId,
    mediaCol: testimonials.avatarMediaId,
    mediaKey: 'avatarMediaId',
    face: true,
  },
  {
    label: 'project_gallery_images',
    table: projectGalleryImages,
    legacy: projectGalleryImages.imagePublicId,
    mediaCol: projectGalleryImages.mediaId,
    mediaKey: 'mediaId',
  },
];

// Legacy ids still waiting for a media id (selectDistinct for refs, plain for verify).
const pendingIds = async (def: Def, distinct = true) => {
  const base = distinct ? db.selectDistinct({ id: def.legacy }) : db.select({ id: def.legacy });
  const rows = await base.from(def.table).where(and(isNotNull(def.legacy), isNull(def.mediaCol)));
  return (rows as { id: string | null }[]).flatMap((r) => (r.id ? [r.id] : []));
};

async function contentRefs(): Promise<Ref[]> {
  const refs: Ref[] = [];
  for (const def of DEFS) {
    for (const id of await pendingIds(def)) {
      refs.push({ publicId: id, resource: 'image', face: Boolean(def.face), scope: 'library', where: def.label });
    }
  }
  return refs;
}

type SettingsRow = { key: string; version: number; value: unknown };

function settingsRefsOf(row: SettingsRow): Ref[] {
  const refs: Ref[] = [];
  mapRefs(row.value, (ref, path) => {
    if (ref.kind === 'cloudinary') {
      const last = path[path.length - 1];
      refs.push({
        publicId: ref.publicId,
        resource: last === 'video' ? 'video' : 'image',
        // About page team photos are portraits: frame them on the face.
        face: path.includes('members') && last === 'image',
        scope: 'library',
        where: `settings ${row.key}`,
      });
    }
    return ref;
  });
  return refs;
}

async function settingsRows(): Promise<SettingsRow[]> {
  return db.select({ key: settings.key, version: settings.version, value: settings.value }).from(settings);
}

type PhotoOwner = { table: 'quote' | 'contact'; id: string; urls: string[] };

async function photoOwners(): Promise<PhotoOwner[]> {
  const owners: PhotoOwner[] = [];
  const quotes = await db.select({ id: quoteRequests.id, urls: quoteRequests.photoUrls }).from(quoteRequests);
  const contacts = await db.select({ id: contactMessages.id, urls: contactMessages.photoUrls }).from(contactMessages);
  for (const q of quotes)
    if (q.urls?.some((u) => publicIdFromUrl(u))) owners.push({ table: 'quote', id: q.id, urls: q.urls ?? [] });
  for (const c of contacts)
    if (c.urls?.some((u) => publicIdFromUrl(u))) owners.push({ table: 'contact', id: c.id, urls: c.urls ?? [] });
  return owners;
}

const photoRefs = (owners: PhotoOwner[]): Ref[] =>
  owners.flatMap((o) =>
    o.urls.flatMap((url) => {
      const publicId = publicIdFromUrl(url);
      return publicId
        ? [{ publicId, resource: 'image' as const, face: false, scope: 'enquiry' as const, where: `${o.table} photo` }]
        : [];
    }),
  );

const urlFor = (cloudName: string, resource: Resource, publicId: string, png = false) =>
  resource === 'video'
    ? `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,vc_h264/${publicId}.mp4`
    : png
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_png/${publicId}.png`
      : `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

// The point sharp's attention strategy finds most interesting, as 0..1 fractions.
async function attentionFocal(bytes: Buffer): Promise<{ x: number; y: number } | undefined> {
  try {
    const { info } = await sharp(bytes)
      .resize(256, 256, { fit: 'cover', position: sharp.strategy.attention })
      .toBuffer({ resolveWithObject: true });
    const { attentionX, attentionY } = info as { attentionX?: number; attentionY?: number };
    if (attentionX === undefined || attentionY === undefined) return undefined;
    const clamp = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 100) / 100;
    return { x: clamp(attentionX / info.width), y: clamp(attentionY / info.height) };
  } catch {
    return undefined;
  }
}

// Copies every Cloudinary image/video the site still points at into the media library
// (R2 in production), then points the data at the copies. Nothing is ever deleted, and
// the legacy ids stay, so a re-run (or a deploy before the run) can never lose an image.
export async function migrateCloudinaryMedia(opts: {
  dryRun: boolean;
  cloudName: string;
  fetchAsset?: FetchAsset;
}): Promise<MigrationReport> {
  const fetchAsset = opts.fetchAsset ?? defaultFetchAsset;

  // Every public settings key must exist first, or the settings rewrite would skip pages.
  const present = new Set((await settingsRows()).map((r) => r.key));
  if (PUBLIC_SETTINGS_KEYS.some((key) => !present.has(key))) {
    throw new MigrationRefused('Run yarn settings:migrate first');
  }

  const rows = await settingsRows();
  const owners = await photoOwners();
  const all = [...(await contentRefs()), ...rows.flatMap(settingsRefsOf), ...photoRefs(owners)];
  const unique = new Map<string, Ref>();
  for (const ref of all) {
    const key = legacySourceOf(ref.resource, ref.publicId);
    const known = unique.get(key);
    // Face framing and library scope win when one asset is used in several places, whatever the list order.
    if (!known) unique.set(key, ref);
    else {
      if (ref.face) known.face = true;
      if (ref.scope === 'library') known.scope = 'library';
    }
  }

  const report: MigrationReport = {
    refs: unique.size,
    copied: 0,
    reused: 0,
    missing: [],
    failed: [],
    plan: [],
    rewritten: { columns: 0, settings: [], enquiryPhotos: 0 },
  };

  for (const [legacySource, ref] of unique) {
    const source = urlFor(opts.cloudName, ref.resource, ref.publicId);
    const existing = (await db.select().from(media).where(eq(media.legacySource, legacySource)).limit(1))[0];
    if (existing && existing.deletedAt) {
      // Deleted in the library on purpose: never relink to it, and never silently resurrect it.
      report.plan.push({ action: 'BLOCKED', source, legacySource });
      report.failed.push(`${legacySource}: its media row ${existing.id} was deleted in the library`);
      continue;
    }
    if (existing) {
      report.plan.push({ action: 'REUSE', source, legacySource });
      report.reused += 1;
      continue;
    }

    let bytes: Buffer | null;
    try {
      bytes = await fetchAsset(source);
    } catch (error) {
      report.plan.push({ action: 'FAILED', source, legacySource });
      report.failed.push(`${legacySource}: ${error instanceof Error ? error.message : 'download failed'}`);
      continue;
    }
    if (!bytes) {
      report.plan.push({ action: 'MISSING', source, legacySource });
      report.missing.push(legacySource);
      continue;
    }
    report.plan.push({ action: 'COPY', source, legacySource });
    if (opts.dryRun) continue;

    const filename = ref.publicId.split('/').pop() ?? 'file';
    const ingest = async (data: Buffer, name: string) =>
      mediaLibraryService.ingest({
        bytes: data,
        filename: name,
        actorId: null,
        scope: ref.scope,
        legacySource,
        focal: ref.face && ref.resource === 'image' ? await attentionFocal(data) : undefined,
      });
    try {
      try {
        await ingest(bytes, filename);
      } catch (error) {
        // HEIC / GIF / SVG and friends: ask Cloudinary for a PNG rendition once.
        if (!(error instanceof ApiError) || ref.resource !== 'image' || (error.status !== 415 && error.status !== 422))
          throw error;
        const png = await fetchAsset(urlFor(opts.cloudName, 'image', ref.publicId, true));
        if (!png) throw error;
        await ingest(png, `${filename}.png`);
      }
      report.copied += 1;
    } catch (error) {
      if (error instanceof DeletedLegacySourceError) report.failed.push(`${legacySource}: its media row was deleted`);
      else report.failed.push(`${legacySource}: ${error instanceof Error ? error.message : 'could not be stored'}`);
    }
  }

  if (!opts.dryRun) await rewrite(report, owners);
  return report;
}

async function mediaIdBySource(): Promise<Map<string, string>> {
  const found = await db
    .select({ id: media.id, source: media.legacySource })
    .from(media)
    .where(and(isNull(media.deletedAt), like(media.legacySource, 'cloudinary:%')));
  return new Map(found.flatMap((m) => (m.source ? [[m.source, m.id] as const] : [])));
}

async function rewrite(report: MigrationReport, owners: PhotoOwner[]) {
  const ids = await mediaIdBySource();
  const image = (publicId: string) => ids.get(legacySourceOf('image', publicId));

  // Content columns (and project galleries): set the media id where it is still empty; the
  // legacy id stays so the fallback remains valid until Phase 11.
  for (const def of DEFS) {
    for (const legacyId of await pendingIds(def)) {
      const mediaId = image(legacyId);
      if (!mediaId) continue;
      const updated = await db
        .update(def.table)
        .set({ [def.mediaKey]: mediaId } as never)
        .where(and(eq(def.legacy, legacyId), isNull(def.mediaCol)))
        .returning();
      report.rewritten.columns += updated.length;
    }
  }

  // Settings: one new version per document that changed.
  for (const row of await settingsRows()) {
    let changed = false;
    const value = mapRefs(row.value, (ref, path) => {
      if (ref.kind !== 'cloudinary') return ref;
      const resource: Resource = path[path.length - 1] === 'video' ? 'video' : 'image';
      const mediaId = ids.get(legacySourceOf(resource, ref.publicId));
      if (!mediaId) return ref;
      changed = true;
      return { kind: 'media' as const, id: mediaId };
    });
    if (!changed) continue;
    try {
      await settingsRepository.save(row.key, { version: row.version, value }, null, MIGRATION_NOTE, async (tx) => {
        await audit(
          null,
          {
            action: 'media.migrate',
            entityType: 'setting',
            entityId: row.key,
            summary: `Moved ${row.key} images to R2`,
          },
          tx,
        );
      });
      report.rewritten.settings.push(row.key);
    } catch (error) {
      // e.g. an admin saved this document meanwhile: report it and carry on with the rest.
      report.failed.push(`settings ${row.key}: ${error instanceof Error ? error.message : 'could not be saved'}`);
    }
  }

  // Enquiry photos: link each migrated URL to its lead, once.
  for (const owner of owners) {
    const parent = owner.table === 'quote' ? enquiryPhotos.quoteRequestId : enquiryPhotos.contactMessageId;
    const linked = new Set(
      (await db.select({ mediaId: enquiryPhotos.mediaId }).from(enquiryPhotos).where(eq(parent, owner.id))).map(
        (l) => l.mediaId,
      ),
    );
    for (const [position, url] of owner.urls.entries()) {
      const publicId = publicIdFromUrl(url);
      const mediaId = publicId ? image(publicId) : undefined;
      if (!mediaId || linked.has(mediaId)) continue;
      await db.insert(enquiryPhotos).values({
        ...(owner.table === 'quote' ? { quoteRequestId: owner.id } : { contactMessageId: owner.id }),
        mediaId,
        position,
      });
      linked.add(mediaId);
      report.rewritten.enquiryPhotos += 1;
    }
  }
}

// A stored file exists and is non-empty: a stat for local files, a HEAD request for R2 (no body is
// downloaded, so verifying a big library stays cheap).
async function isReachable(file: { driver: string; key: string; url: string }): Promise<boolean> {
  try {
    if (file.driver === 'local') {
      const local = localFile(file.key);
      return local ? (await stat(local.path)).size > 0 : false;
    }
    const res = await fetch(file.url, { method: 'HEAD', signal: AbortSignal.timeout(5000), redirect: 'error' });
    const length = res.headers.get('content-length');
    return res.ok && (length === null || Number(length) > 0);
  } catch {
    return false;
  }
}

// What is still on Cloudinary, plus migrated files that cannot be read back. Empty = done.
export async function verifyCloudinaryMigration(): Promise<{ ok: boolean; problems: string[] }> {
  const problems: string[] = [];

  for (const def of DEFS) {
    for (const id of await pendingIds(def, false)) problems.push(`UNMIGRATED ${def.label} ${id}`);
  }

  for (const row of await settingsRows()) {
    for (const ref of settingsRefsOf(row)) problems.push(`UNMIGRATED settings ${row.key} ${ref.publicId}`);
  }

  const ids = await mediaIdBySource();
  for (const owner of await photoOwners()) {
    const parent = owner.table === 'quote' ? enquiryPhotos.quoteRequestId : enquiryPhotos.contactMessageId;
    const linked = new Set(
      (await db.select({ mediaId: enquiryPhotos.mediaId }).from(enquiryPhotos).where(eq(parent, owner.id))).map(
        (l) => l.mediaId,
      ),
    );
    for (const url of owner.urls) {
      const publicId = publicIdFromUrl(url);
      if (!publicId) continue;
      const mediaId = ids.get(legacySourceOf('image', publicId));
      if (!mediaId || !linked.has(mediaId)) problems.push(`UNMIGRATED ${owner.table} photo ${publicId}`);
    }
  }

  const migrated = await db
    .select({ id: media.id, driver: media.driver, key: media.key, url: media.url })
    .from(media)
    .where(and(isNull(media.deletedAt), isNotNull(media.legacySource)));
  for (const file of migrated) {
    if (!(await isReachable(file))) problems.push(`UNREADABLE ${file.id}`);
  }
  return { ok: problems.length === 0, problems };
}
