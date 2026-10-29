import 'server-only';

import { eq } from 'drizzle-orm';
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { REDIRECTS_TAG } from '@/lib/cache/redirects-tag';
import { LIVE_PATHS, isReservedPath } from '@/lib/seo/public-pages';
import { db, type DbLike } from '@/server/db';
import { redirects } from '@/server/db/schema';
import type { Actor } from '@/server/lib/auth/actor';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { assertMediaExistsLocked } from '@/server/lib/media/assert-media';
import { prepareShareImage } from '@/server/lib/media/content-images';
import { legalPageRepository } from '@/server/repositories/legal-page-repository';
import { createRedirect, lockRedirects } from '@/server/services/redirect-service';
import type {
  CreateLegalPageInput,
  LegalPageListQuery,
  ReorderLegalPagesInput,
  UpdateLegalPageInput,
} from '@/validations/legal-page-schema';

const LIST_TAG = CACHE_TAGS.all('legal-pages');
const slugTag = (slug: string) => CACHE_TAGS.detail('legal-pages', slug);

const slugError = (message: string, status = 422) =>
  new ApiError(status === 409 ? ERROR_CODES.CONFLICT : ERROR_CODES.VALIDATION_ERROR, message, status, {
    slug: [message],
  });

// The page lives at the site root, so its address must not belong to the app or another page.
// A redirect from the new address back to this page is the one left by an earlier rename: it is
// removed rather than refused, and the result says so (the redirect table must then expire).
async function assertSlugAvailable(tx: DbLike, slug: string, page?: { id: string; slug: string }): Promise<boolean> {
  const path = `/${slug}`;
  if (isReservedPath(path) || LIVE_PATHS.has(path)) throw slugError(`${path} is already used by the site`);
  if (await legalPageRepository.slugTaken(slug, page?.id, tx)) throw slugError('Another legal page uses this address');
  const [redirect] = await tx
    .select({ id: redirects.id, destination: redirects.destination })
    .from(redirects)
    .where(eq(redirects.sourcePath, path))
    .limit(1);
  if (!redirect) return false;
  if (page && redirect.destination === `/${page.slug}`) {
    await lockRedirects(tx);
    await tx.delete(redirects).where(eq(redirects.id, redirect.id));
    return true;
  }
  throw slugError(`A redirect from ${path} already exists — remove it in SEO → Redirects first`, 409);
}

// jsonb stores object keys in its own order, so a re-saved, unchanged document must not
// compare as edited (that would move the public "Last updated" date).
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .filter(([, v]) => v !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => [k, canonical(v)]),
        )
      : value;
const sameJson = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

function expire(...slugs: string[]) {
  // Second arg must match the `cacheLife` profile used by the cached reads below.
  revalidateTag(LIST_TAG, 'hours');
  for (const slug of slugs) revalidateTag(slugTag(slug), 'hours');
}

async function listPublishedLinksCached() {
  'use cache';
  cacheTag(LIST_TAG);
  cacheLife('hours');
  const rows = await legalPageRepository.listPublished();
  return rows.map(({ title, slug }) => ({ title, slug }));
}

// Footer links: a failed DB read renders no legal links, but outside the cache — caught inside,
// the empty fallback would be cached and outlive the outage (and break the build's prerender).
async function listPublishedLinks() {
  try {
    return await listPublishedLinksCached();
  } catch (error) {
    console.warn('[legalPageService] listing published pages failed, rendering none:', error);
    return [];
  }
}

async function listPublishedForSitemapCached() {
  'use cache';
  cacheTag(LIST_TAG);
  cacheLife('hours');
  return legalPageRepository.listPublished();
}

// The proxy's view of which root addresses exist. Null on a failed read, so it fails open.
async function publishedSlugs(): Promise<ReadonlySet<string> | null> {
  try {
    return new Set((await listPublishedLinksCached()).map((page) => page.slug));
  } catch (error) {
    console.warn('[legalPageService] listing published slugs failed:', error);
    return null;
  }
}

async function getPageBySlugCached(slug: string) {
  'use cache';
  cacheTag(LIST_TAG, slugTag(slug));
  cacheLife('hours');
  return (await legalPageRepository.publishedBySlug(slug)) ?? null;
}

// Any path a visitor or bot types lands here: only a slug in the (one, cached) published list
// costs a lookup, so unknown paths never reach the database or add cache entries.
async function getPublishedBySlug(slug: string) {
  const published = await listPublishedLinksCached();
  return published.some((page) => page.slug === slug) ? getPageBySlugCached(slug) : null;
}

export const legalPageService = {
  listPublishedLinks,
  listPublishedForSitemap: listPublishedForSitemapCached,
  getPublishedBySlug,
  publishedSlugs,

  // Uncached: the admin table always shows fresh data, drafts included.
  async listAdmin(params: Pick<LegalPageListQuery, 'page' | 'limit'>) {
    return legalPageRepository.list(params);
  },

  async byId(id: string) {
    return legalPageRepository.byId(id);
  },

  async create(_actor: Actor, input: CreateLegalPageInput) {
    const shareIds = await prepareShareImage(input.ogImageMediaId);
    const id = await db.transaction(async (tx) => {
      await assertMediaExistsLocked(tx, shareIds);
      await assertSlugAvailable(tx, input.slug);
      const status = input.status ?? 'draft';
      return legalPageRepository.insert(
        { ...input, status, publishedAt: status === 'published' ? new Date() : null },
        tx,
      );
    });
    expire(input.slug);
    return legalPageRepository.byId(id);
  },

  async update(actor: Actor, id: string, input: UpdateLegalPageInput) {
    const shareIds = await prepareShareImage(input.ogImageMediaId);
    const result = await db.transaction(async (tx) => {
      await assertMediaExistsLocked(tx, shareIds);
      const before = await legalPageRepository.byId(id, tx);
      if (!before) return undefined;
      const renamed = input.slug !== undefined && input.slug !== before.slug;
      const removedRedirect = renamed ? await assertSlugAvailable(tx, input.slug!, before) : false;

      const status = input.status ?? before.status;
      const edited =
        (input.title !== undefined && input.title !== before.title) ||
        (input.content !== undefined && !sameJson(input.content, before.content));
      const publishing = status === 'published' && before.status !== 'published';
      const stamp = publishing || (status === 'published' && edited) ? { publishedAt: new Date() } : {};

      await legalPageRepository.patch(id, { ...input, ...stamp }, tx);
      // Links already shared to a live page keep working after a rename.
      if (renamed && before.status === 'published') {
        await createRedirect(tx, {
          from: `/${before.slug}`,
          to: `/${input.slug}`,
          statusCode: 301,
          note: 'Legal page renamed',
          createdBy: actor.userId,
        });
      }
      return { before, redirected: removedRedirect || (renamed && before.status === 'published') };
    });
    if (!result) return undefined;
    expire(result.before.slug, ...(input.slug ? [input.slug] : []));
    if (result.redirected) revalidateTag(REDIRECTS_TAG, { expire: 0 });
    return legalPageRepository.byId(id);
  },

  async remove(id: string) {
    const row = await legalPageRepository.remove(id);
    expire(...(row ? [row.slug] : []));
  },

  async reorder(input: ReorderLegalPagesInput) {
    await legalPageRepository.reorder(input.ids);
    expire();
  },
};
