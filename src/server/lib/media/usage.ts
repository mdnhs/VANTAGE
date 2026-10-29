import 'server-only';

import { eq, sql } from 'drizzle-orm';

import {
  GLOBAL_LABELS,
  SETTINGS_PAGES,
  SETTINGS_PAGE_LABELS,
  type EditableGlobalKey,
} from '@/lib/content/global-access';
import type { DbLike } from '@/server/db';
import {
  enquiryPhotos,
  homepageCatalogs,
  legalPages,
  partnerLogos,
  projectGalleryImages,
  projects,
  services,
  settings,
  testimonials,
} from '@/server/db/schema';

export type MediaUse = { kind: 'setting' | 'content' | 'enquiry'; id: string; label: string; href: string | null };

// Tables whose rows can name a media id; `remove` locks them so a reference
// cannot appear between the usage check and the soft delete.
export const MEDIA_REFERRER_TABLES = [
  'settings',
  'services',
  'homepage_catalogs',
  'partner_logos',
  'projects',
  'project_gallery_images',
  'testimonials',
  'enquiry_photos',
  'legal_pages',
] as const;

const PAGE_KEY_HREFS: Record<string, string> = {
  'page.home': '/dashboard/home-page',
  'page.services': '/dashboard/services',
  'page.our-work': '/dashboard/projects',
  'page.insurance': '/dashboard/insurance',
  'page.about': '/dashboard/about',
  'page.process': '/dashboard/process-page',
};

function settingUse(key: string): MediaUse {
  const global = GLOBAL_LABELS[key as EditableGlobalKey];
  const slug = (Object.keys(SETTINGS_PAGES) as (keyof typeof SETTINGS_PAGES)[]).find((page) =>
    (SETTINGS_PAGES[page] as readonly string[]).includes(key),
  );
  const label = global ?? (slug ? SETTINGS_PAGE_LABELS[slug] : key);
  const href = slug ? `/dashboard/settings/${slug}` : (PAGE_KEY_HREFS[key] ?? null);
  return { kind: 'setting', id: key, label, href };
}

// Everything that still names this media id. A soft delete must not leave a
// reference behind, so the library refuses while this is non-empty.
export async function mediaUsage(db: DbLike, id: string): Promise<MediaUse[]> {
  const uses: MediaUse[] = [];

  const settingRows = await db
    .select({ key: settings.key })
    .from(settings)
    .where(sql`${settings.value}::text like ${`%${id}%`}`);
  for (const row of settingRows) uses.push(settingUse(row.key));

  const content = (rows: { id: string; name: string }[], what: string, href: string) => {
    for (const row of rows) uses.push({ kind: 'content', id: row.id, label: `${what} "${row.name}"`, href });
  };

  content(
    await db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(
        sql`${services.iconMediaId} = ${id} or ${services.imageMediaId} = ${id} or ${services.ogImageMediaId} = ${id}`,
      ),
    'Service',
    '/dashboard/services',
  );
  content(
    await db
      .select({ id: homepageCatalogs.id, name: homepageCatalogs.title })
      .from(homepageCatalogs)
      .where(eq(homepageCatalogs.iconMediaId, id)),
    'Catalog card',
    '/dashboard/homepage-catalogs',
  );
  content(
    await db
      .select({ id: partnerLogos.id, name: partnerLogos.companyName })
      .from(partnerLogos)
      .where(eq(partnerLogos.logoMediaId, id)),
    'Partner logo',
    '/dashboard/partner-logos',
  );
  content(
    await db
      .select({ id: projects.id, name: projects.title })
      .from(projects)
      .where(
        sql`${projects.beforeImageMediaId} = ${id} or ${projects.afterImageMediaId} = ${id} or ${projects.ogImageMediaId} = ${id}`,
      ),
    'Project',
    '/dashboard/projects',
  );
  content(
    await db
      .select({ id: projects.id, name: projects.title })
      .from(projectGalleryImages)
      .innerJoin(projects, eq(projects.id, projectGalleryImages.projectId))
      .where(eq(projectGalleryImages.mediaId, id)),
    'Project gallery',
    '/dashboard/projects',
  );
  content(
    await db
      .select({ id: testimonials.id, name: testimonials.customerName })
      .from(testimonials)
      .where(eq(testimonials.avatarMediaId, id)),
    'Testimonial',
    '/dashboard/testimonials',
  );
  content(
    await db
      .select({ id: legalPages.id, name: legalPages.title })
      .from(legalPages)
      .where(eq(legalPages.ogImageMediaId, id)),
    'Legal page',
    '/dashboard/legal-pages',
  );

  const photos = await db
    .select({ quoteId: enquiryPhotos.quoteRequestId, contactId: enquiryPhotos.contactMessageId })
    .from(enquiryPhotos)
    .where(eq(enquiryPhotos.mediaId, id));
  for (const photo of photos) {
    uses.push(
      photo.quoteId
        ? {
            kind: 'enquiry',
            id: photo.quoteId,
            label: 'Quote request photo',
            href: `/dashboard/quotes/${photo.quoteId}`,
          }
        : {
            kind: 'enquiry',
            id: photo.contactId!,
            label: 'Contact message photo',
            href: `/dashboard/contacts/${photo.contactId}`,
          },
    );
  }

  return uses;
}
