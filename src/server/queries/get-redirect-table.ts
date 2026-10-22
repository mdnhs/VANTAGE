import 'server-only';

import { eq } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { REDIRECTS_TAG } from '@/lib/cache/redirects-tag';
import type { RedirectStatus } from '@/lib/seo/redirect-rules';
import type { RedirectTable } from '@/lib/seo/route-resolution';
import { db } from '@/server/db';
import { redirects } from '@/server/db/schema';

// One small cached entry answers every proxy lookup until a redirect write expires the tag.
export async function getRedirectTable(): Promise<RedirectTable> {
  'use cache';
  cacheTag(REDIRECTS_TAG);
  cacheLife('max');
  const rows = await db
    .select({ source: redirects.sourcePath, destination: redirects.destination, statusCode: redirects.statusCode })
    .from(redirects)
    .where(eq(redirects.isActive, true));
  return Object.fromEntries(
    rows.map((r) => [r.source, { destination: r.destination, statusCode: r.statusCode as RedirectStatus }]),
  );
}
