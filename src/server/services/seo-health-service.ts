import 'server-only';

import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { collectMediaIds } from '@/lib/content/image-ref';
import { parseGlobal, type GlobalValue } from '@/lib/content/globals';
import { seoPageKey } from '@/lib/content/globals-seo';
import { withLegacyMeta } from '@/lib/seo/legacy-meta';
import { pageDescription } from '@/lib/seo/metadata';
import { siteEnvFrom } from '@/lib/seo/robots';
import { runChecks } from '@/lib/seo/checks';
import type { SeoHealth, SeoIssue } from '@/lib/seo/health-types';
import { PUBLIC_PAGE_LIST, seoFixHref, type PublicPageId } from '@/lib/seo/public-pages';
import { documentTitle } from '@/lib/seo/title';
import { db as defaultDb, type DbLike } from '@/server/db';
import {
  homepageCatalogs,
  media,
  partnerLogos,
  projectGalleryImages,
  projects,
  services,
  settings,
  testimonials,
} from '@/server/db/schema';
import { siteSettingsService } from '@/server/services/site-settings-service';

export type { SeoHealth, SeoIssue } from '@/lib/seo/health-types';

const ids = (list: (string | null)[]): string[] => list.filter((v): v is string => !!v);

// Distinct in-site hrefs a stored page document links to.
function internalHrefs(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => internalHrefs(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'href' && typeof v === 'string' && /^\/(?!\/)/.test(v.trim())) out.add(v.trim());
      else internalHrefs(v, out);
    }
  }
  return out;
}

async function readValue<K extends Parameters<typeof parseGlobal>[0]>(dbLike: DbLike, key: K) {
  const [row] = await dbLike.select().from(settings).where(eq(settings.key, key)).limit(1);
  return { raw: row?.value, value: parseGlobal(key, row?.value) };
}

// Media rows each page shows: its `page.*` document plus the public list reads (same filters
// as the services' public list queries). Library scope only is applied when rows are loaded.
// `docs` are the already-parsed `page.*` documents (read here when not given).
export async function pageMediaIds(
  dbLike: DbLike = defaultDb,
  docs?: Partial<Record<PublicPageId, unknown>>,
): Promise<Record<PublicPageId, string[]>> {
  const [pageDocs, catalogs, logos, featuredTestimonials, publishedProjects, gallery, serviceRows] = await Promise.all([
    Promise.all(
      PUBLIC_PAGE_LIST.map(
        async (p) =>
          [p.id, docs ? (docs[p.id] ?? null) : p.pageKey ? (await readValue(dbLike, p.pageKey)).value : null] as const,
      ),
    ),
    dbLike
      .select({ icon: homepageCatalogs.iconMediaId })
      .from(homepageCatalogs)
      .where(eq(homepageCatalogs.isEnabled, true)),
    dbLike.select({ logo: partnerLogos.logoMediaId }).from(partnerLogos).where(eq(partnerLogos.isEnabled, true)),
    dbLike
      .select({ avatar: testimonials.avatarMediaId })
      .from(testimonials)
      .where(and(eq(testimonials.isFeatured, true), eq(testimonials.status, 'published')))
      .orderBy(asc(testimonials.displayOrder))
      .limit(6),
    dbLike
      .select({
        before: projects.beforeImageMediaId,
        after: projects.afterImageMediaId,
        featured: projects.isFeatured,
      })
      .from(projects)
      .where(eq(projects.status, 'published')),
    dbLike
      .select({ id: projectGalleryImages.mediaId })
      .from(projectGalleryImages)
      .innerJoin(projects, eq(projects.id, projectGalleryImages.projectId))
      .where(eq(projects.status, 'published')),
    dbLike
      .select({ icon: services.iconMediaId, image: services.imageMediaId })
      .from(services)
      .where(eq(services.isEnabled, true)),
  ]);

  const out = Object.fromEntries(
    pageDocs.map(([id, doc]) => [id, new Set<string>(doc ? collectMediaIds(doc) : [])]),
  ) as Record<PublicPageId, Set<string>>;
  const add = (page: PublicPageId, list: (string | null)[]) => ids(list).forEach((v) => out[page].add(v));

  add(
    'home',
    catalogs.map((r) => r.icon),
  );
  add(
    'home',
    logos.map((r) => r.logo),
  );
  add(
    'home',
    featuredTestimonials.map((r) => r.avatar),
  );
  add(
    'home',
    publishedProjects.filter((p) => p.featured).flatMap((p) => [p.before, p.after]),
  );
  add(
    'services',
    serviceRows.flatMap((r) => [r.icon, r.image]),
  );
  add(
    'our-work',
    publishedProjects.flatMap((p) => [p.before, p.after]),
  );
  add(
    'our-work',
    gallery.map((g) => g.id),
  );

  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]])) as Record<PublicPageId, string[]>;
}

// Reports lag edits to services, projects, testimonials, logos and catalogs by one read: their
// writes expire tags with revalidateTag(tag, 'hours' | 'minutes') (stale-while-revalidate), so the
// cached getSeoHealth serves the old report once before refreshing. Settings and media edits
// expire at once.
export async function computeSeoHealth(dbLike: DbLike = defaultDb): Promise<SeoHealth> {
  // Grade what the pages ship: the same legacy-aware defaults and site name as getPageMetadata.
  const [defaults, publicSettings, perPage] = await Promise.all([
    readValue(dbLike, 'seo'),
    siteSettingsService.getPublic(),
    Promise.all(
      PUBLIC_PAGE_LIST.map(async (p) => {
        const [seo, doc] = await Promise.all([
          readValue(dbLike, seoPageKey(p.id)),
          p.pageKey ? readValue(dbLike, p.pageKey) : Promise.resolve(null),
        ]);
        return { page: p, seo: seo.value as GlobalValue<`seo.page.${PublicPageId}`>, doc: doc?.value ?? null };
      }),
    ),
  ]);
  const mediaByPage = await pageMediaIds(
    dbLike,
    Object.fromEntries(perPage.map((p) => [p.page.id, p.doc])) as Partial<Record<PublicPageId, unknown>>,
  );
  const seoDefaults = withLegacyMeta(defaults.value, publicSettings);
  const siteName = publicSettings.businessName;
  // robots.txt is prerendered from SITE_ENV: a production server without it disallows everything.
  const blockedByEnv = process.env.NODE_ENV === 'production' && siteEnvFrom({ SITE_ENV: process.env.SITE_ENV, VERCEL_ENV: process.env.VERCEL_ENV }) !== 'production';

  const ogIds = ids([
    seoDefaults.defaultOgImage?.kind === 'media' ? seoDefaults.defaultOgImage.id : null,
    ...perPage.map((p) => (p.seo.ogImage?.kind === 'media' ? p.seo.ogImage.id : null)),
  ]);
  const allIds = [...new Set([...Object.values(mediaByPage).flat(), ...ogIds])];
  const rows = allIds.length
    ? await dbLike
        .select()
        .from(media)
        .where(and(inArray(media.id, allIds), isNull(media.deletedAt), eq(media.scope, 'library')))
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const isMissing = (r: (typeof rows)[number]) => r.alt.trim() === '' && !r.isDecorative;
  const onPages = new Set(Object.values(mediaByPage).flat());
  const images = rows.filter((r) => r.mimeType.startsWith('image/') && onPages.has(r.id));

  const titleOf = (p: (typeof perPage)[number]) =>
    documentTitle(
      { id: p.page.id, seoTitle: p.seo.title },
      { titleTemplate: seoDefaults.titleTemplate, siteName },
    );
  const titles = perPage.map(titleOf);
  const tally = new Map<string, number>();
  for (const t of titles) tally.set(t.trim().toLowerCase(), (tally.get(t.trim().toLowerCase()) ?? 0) + 1);

  const issues: SeoIssue[] = [];
  let passed = 0;
  let total = 0;
  if (blockedByEnv) {
    issues.push({
      kind: 'site',
      id: 'site',
      title: 'Whole site',
      path: null,
      check: 'indexable',
      message: 'Search engines are blocked: SITE_ENV is not set to production',
      // A server setting, not an admin field: nothing in the admin fixes it.
      fixHref: null,
    });
  }
  perPage.forEach((p, i) => {
    const { page } = p;
    const title = titles[i]!;
    const og = p.seo.ogImage?.kind === 'media' ? p.seo.ogImage : seoDefaults.defaultOgImage;
    const ogRow = og?.kind === 'media' ? byId.get(og.id) : undefined;
    const pageImages = (mediaByPage[page.id] ?? [])
      .map((id) => byId.get(id))
      .filter((r) => !!r && r.mimeType.startsWith('image/'));
    const links = page.codeLinks + internalHrefs(p.doc).size;
    const results = runChecks({
      title,
      titleUnique: tally.get(title.trim().toLowerCase()) === 1,
      description: pageDescription({
        id: page.id,
        seo: p.seo,
        defaults: seoDefaults,
        siteName,
        ogImage: null,
      }),
      ogImage: ogRow ? { width: ogRow.width ?? 0, height: ogRow.height ?? 0 } : null,
      imagesMissingAlt: pageImages.filter((r) => isMissing(r!)).length,
      hasH1: page.hasH1,
      noindex: p.seo.noindex || seoDefaults.robots === 'noindex' || blockedByEnv,
      internalLinks: links,
    });
    for (const r of results) {
      total += 1;
      if (r.ok) passed += 1;
      else
        issues.push({
          kind: 'page',
          id: page.id,
          title: page.label,
          path: page.path,
          check: r.id,
          message: r.message,
          fixHref: seoFixHref(page.id),
        });
    }
  });

  for (const r of images.filter(isMissing)) {
    issues.push({
      kind: 'media',
      id: r.id,
      title: r.filename,
      path: null,
      check: 'alt-text',
      message: 'Image has no alt text',
      fixHref: `/dashboard/media?missingAlt=true&q=${encodeURIComponent(r.filename)}`,
    });
  }

  const missing = images.filter(isMissing).length;
  const decorative = images.filter((r) => r.isDecorative).length;
  return {
    score: total === 0 ? 100 : Math.round((passed / total) * 100),
    passed,
    total,
    entities: perPage.length,
    issues,
    alt: { images: images.length, described: images.length - missing - decorative, decorative, missing },
  };
}
