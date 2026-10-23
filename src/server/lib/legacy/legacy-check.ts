import 'server-only';

import { and, count, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

import { mapRefs } from '@/lib/content/image-ref';
import { db } from '@/server/db';
import {
  adminUsers,
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
  users,
} from '@/server/db/schema';
import { legacySourceOf, publicIdFromUrl } from '@/server/lib/media/cloudinary-migration';
import { PUBLIC_SETTINGS_KEYS } from '@/server/lib/settings/public-settings';

// Read-only gate for removing the legacy read paths (Phase 11 Stage A / B). It counts rows that
// still depend on Cloudinary ids, the legacy admin table or the legacy site_settings fallback.
// It only ever SELECTs, and it reports counts, never values (photo URLs are personal data).

export type LegacyCheckItem = { label: string; count: number; fix: string };
export type LegacyCheckResult = { ok: boolean; items: LegacyCheckItem[] };

const MEDIA_MIGRATE = 'yarn media:migrate';
const ADMINS_MIGRATE = 'yarn auth:migrate-admins';
const SETTINGS_MIGRATE = 'yarn settings:migrate';

type Pair = { label: string; table: PgTable; legacy: PgColumn; mediaCol: PgColumn };

const PAIRS: Pair[] = [
  { label: 'services.icon', table: services, legacy: services.iconPublicId, mediaCol: services.iconMediaId },
  { label: 'services.image', table: services, legacy: services.imagePublicId, mediaCol: services.imageMediaId },
  {
    label: 'projects.before',
    table: projects,
    legacy: projects.beforeImagePublicId,
    mediaCol: projects.beforeImageMediaId,
  },
  {
    label: 'projects.after',
    table: projects,
    legacy: projects.afterImagePublicId,
    mediaCol: projects.afterImageMediaId,
  },
  {
    label: 'project_gallery_images.image',
    table: projectGalleryImages,
    legacy: projectGalleryImages.imagePublicId,
    mediaCol: projectGalleryImages.mediaId,
  },
  {
    label: 'partner_logos.logo',
    table: partnerLogos,
    legacy: partnerLogos.logoPublicId,
    mediaCol: partnerLogos.logoMediaId,
  },
  {
    label: 'homepage_catalogs.icon',
    table: homepageCatalogs,
    legacy: homepageCatalogs.iconPublicId,
    mediaCol: homepageCatalogs.iconMediaId,
  },
  {
    label: 'testimonials.avatar',
    table: testimonials,
    legacy: testimonials.avatarPublicId,
    mediaCol: testimonials.avatarMediaId,
  },
];

async function pairCount(pair: Pair): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(pair.table)
    .where(and(isNotNull(pair.legacy), isNull(pair.mediaCol)));
  return row?.n ?? 0;
}

// photo_urls entries (Cloudinary URLs) with no linked enquiry photo whose media row carries
// the matching legacy_source.
async function unlinkedEnquiryPhotos(): Promise<number> {
  const linked = await db
    .select({
      quoteId: enquiryPhotos.quoteRequestId,
      contactId: enquiryPhotos.contactMessageId,
      legacySource: media.legacySource,
    })
    .from(enquiryPhotos)
    .innerJoin(media, eq(media.id, enquiryPhotos.mediaId));
  const linkedKeys = new Set(linked.map((l) => `${l.quoteId ?? l.contactId}:${l.legacySource}`));

  let missing = 0;
  const owners = [
    ...(await db.select({ id: quoteRequests.id, urls: quoteRequests.photoUrls }).from(quoteRequests)),
    ...(await db.select({ id: contactMessages.id, urls: contactMessages.photoUrls }).from(contactMessages)),
  ];
  for (const owner of owners) {
    for (const url of owner.urls ?? []) {
      const publicId = publicIdFromUrl(url);
      if (!publicId) continue;
      if (!linkedKeys.has(`${owner.id}:${legacySourceOf('image', publicId)}`)) missing += 1;
    }
  }
  return missing;
}

function holdsCloudinaryRef(value: unknown): boolean {
  let found = false;
  mapRefs(value, (ref) => {
    if (ref.kind === 'cloudinary') found = true;
    return ref;
  });
  return found;
}

export async function legacyCheck(): Promise<LegacyCheckResult> {
  const items: LegacyCheckItem[] = [];

  for (const pair of PAIRS) {
    items.push({ label: pair.label, count: await pairCount(pair), fix: MEDIA_MIGRATE });
  }
  items.push({ label: 'enquiry photos not linked', count: await unlinkedEnquiryPhotos(), fix: MEDIA_MIGRATE });

  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings);
  const present = new Set(rows.map((r) => r.key));
  items.push({
    label: 'settings keys missing',
    count: PUBLIC_SETTINGS_KEYS.filter((key) => !present.has(key)).length,
    fix: SETTINGS_MIGRATE,
  });
  items.push({
    label: 'settings with Cloudinary images',
    count: rows.filter((r) => holdsCloudinaryRef(r.value)).length,
    fix: MEDIA_MIGRATE,
  });

  const [quotes] = await db
    .select({ n: count() })
    .from(quoteRequests)
    .where(and(isNotNull(quoteRequests.assignedAdminId), isNull(quoteRequests.assignedUserId)));
  items.push({ label: 'quotes assigned only to legacy admins', count: quotes?.n ?? 0, fix: ADMINS_MIGRATE });

  const [admins] = await db
    .select({ n: count() })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.isActive, true),
        sql`not exists (select 1 from ${users} where lower(${users.email}) = lower(${adminUsers.email}))`,
      ),
    );
  items.push({ label: 'admin accounts not migrated', count: admins?.n ?? 0, fix: ADMINS_MIGRATE });

  return { ok: items.every((i) => i.count === 0), items };
}
