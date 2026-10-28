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
import { legalPageRepository } from '@/server/repositories/legal-page-repository';
import { createRedirect } from '@/server/services/redirect-service';
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
// `pageSlug` is the page's current slug: a redirect from the new address back to this page is
// the one left by an earlier rename, and is replaced rather than refused.
async function assertSlugAvailable(tx: DbLike, slug: string, page?: { id: string; slug: string }) {
  const path = `/${slug}`;
  if (isReservedPath(path) || LIVE_PATHS.has(path)) throw slugError(`${path} is already used by the site`);
  if (await legalPageRepository.slugTaken(slug, page?.id, tx)) throw slugError('Another legal page uses this address');
  const [redirect] = await tx
    .select({ id: redirects.id, destination: redirects.destination })
    .from(redirects)
    .where(eq(redirects.sourcePath, path))
    .limit(1);
  if (!redirect) return;
  if (page && redirect.destination === `/${page.slug}`) {
    await tx.delete(redirects).where(eq(redirects.id, redirect.id));
    return;
  }
  throw slugError(`A redirect from ${path} already exists — remove it in SEO → Redirects first`, 409);
}

function expire(...slugs: string[]) {
  // Second arg must match the `cacheLife` profile used by the cached reads below.
  revalidateTag(LIST_TAG, 'hours');
  for (const slug of slugs) revalidateTag(slugTag(slug), 'hours');
}

// Throws on a database failure rather than answering "no pages", so the miss is never cached.
async function listPublishedLinksCached() {
  'use cache';
  cacheTag(LIST_TAG);
  cacheLife('hours');
  const rows = await legalPageRepository.listPublished();
  return rows.map(({ title, slug }) => ({ title, slug }));
}

async function listPublishedForSitemapCached() {
  'use cache';
  cacheTag(LIST_TAG);
  cacheLife('hours');
  return legalPageRepository.listPublished();
}

async function getPublishedBySlugCached(slug: string) {
  'use cache';
  cacheTag(LIST_TAG, slugTag(slug));
  cacheLife('hours');
  return (await legalPageRepository.publishedBySlug(slug)) ?? null;
}

export const legalPageService = {
  listPublishedLinks: listPublishedLinksCached,
  listPublishedForSitemap: listPublishedForSitemapCached,
  getPublishedBySlug: getPublishedBySlugCached,

  // Uncached: the admin table always shows fresh data, drafts included.
  async listAdmin(params: Pick<LegalPageListQuery, 'page' | 'limit'>) {
    return legalPageRepository.list(params);
  },

  async byId(id: string) {
    return legalPageRepository.byId(id);
  },

  async create(_actor: Actor, input: CreateLegalPageInput) {
    const id = await db.transaction(async (tx) => {
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
    const result = await db.transaction(async (tx) => {
      const before = await legalPageRepository.byId(id, tx);
      if (!before) return undefined;
      const renamed = input.slug !== undefined && input.slug !== before.slug;
      if (renamed) await assertSlugAvailable(tx, input.slug!, before);

      const status = input.status ?? before.status;
      const edited =
        (input.title !== undefined && input.title !== before.title) ||
        (input.content !== undefined && JSON.stringify(input.content) !== JSON.stringify(before.content));
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
      return { before, redirected: renamed && before.status === 'published' };
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
