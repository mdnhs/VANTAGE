import 'server-only';

import { and, count, desc, eq, ilike, ne, or, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { REDIRECTS_TAG } from '@/lib/cache/redirects-tag';
import type { RedirectDto, RedirectInput, RedirectListQuery, RedirectPatch, RedirectStatus } from '@/lib/seo/redirect-rules';
import { db, type DbLike } from '@/server/db';
import { redirects } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';

export type { RedirectDto };

// pg advisory lock key for redirect writes ("vrdx").
export const REDIRECTS_LOCK_KEY = 0x76726478;
const MAX_HOPS = 10;
const LOOP = 'That would create a redirect loop';
const SELF = "A redirect can't point at itself";
const pathOf = (target: string) => target.split('?')[0]!;

// Serialises every transaction that writes redirects, so two writers can't each miss the
// other's row and leave a loop or an unflattened chain. Transaction-scoped: pass a tx.
export async function lockRedirects(tx: DbLike) {
  await tx.execute(sql`select pg_advisory_xact_lock(${REDIRECTS_LOCK_KEY})`);
}

const unprocessable = (message: string, field: string) =>
  new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 422, { [field]: [message] });

// Where `to` finally lands, following active redirects.
async function finalTarget(tx: DbLike, from: string, to: string) {
  const seen = new Set([from]);
  let target = to;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (seen.has(pathOf(target))) throw unprocessable(LOOP, 'destination');
    seen.add(pathOf(target));
    const [next] = await tx
      .select({ destination: redirects.destination })
      .from(redirects)
      .where(and(eq(redirects.sourcePath, pathOf(target)), eq(redirects.isActive, true)))
      .limit(1);
    if (!next) return target;
    target = next.destination;
  }
  throw unprocessable(LOOP, 'destination');
}

// Every writer goes through here: the new row points at the final target, and every chain
// that ended at `from` now ends there directly.
export async function createRedirect(
  tx: DbLike,
  entry: { from: string; to: string; statusCode?: number; note: string; createdBy: string | null },
) {
  if (entry.from === pathOf(entry.to)) throw unprocessable(SELF, 'destination');
  await lockRedirects(tx);
  const to = await finalTarget(tx, entry.from, entry.to);
  // A switched-off row starting at the target stays as it is: repointing it would make it
  // point at itself.
  await tx
    .update(redirects)
    .set({ destination: to })
    .where(and(eq(redirects.destination, entry.from), ne(redirects.sourcePath, pathOf(to))));
  const values = { destination: to, statusCode: entry.statusCode ?? 301, isActive: true, note: entry.note };
  await tx
    .insert(redirects)
    .values({ sourcePath: entry.from, createdBy: entry.createdBy, ...values })
    .onConflictDoUpdate({ target: redirects.sourcePath, set: values });
  return { to };
}

type Row = typeof redirects.$inferSelect;
const present = (r: Row): RedirectDto => ({
  id: r.id,
  sourcePath: r.sourcePath,
  destination: r.destination,
  statusCode: r.statusCode as RedirectStatus,
  isActive: r.isActive,
  hitCount: r.hitCount,
  lastHitAt: r.lastHitAt ? r.lastHitAt.toISOString() : null,
  note: r.note,
  updatedAt: r.updatedAt.toISOString(),
});

// `%` and `_` in the search box are literal characters, not wildcards.
const like = (q: string) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

export async function listRedirects(q: RedirectListQuery): Promise<{ rows: RedirectDto[]; total: number }> {
  const where = q.q
    ? or(ilike(redirects.sourcePath, like(q.q)), ilike(redirects.destination, like(q.q)))
    : undefined;
  const [rows, [totals]] = await Promise.all([
    db
      .select()
      .from(redirects)
      .where(where)
      .orderBy(desc(redirects.updatedAt), desc(redirects.id))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit),
    db.select({ total: count() }).from(redirects).where(where),
  ]);
  return { rows: rows.map(present), total: totals?.total ?? 0 };
}

async function findRow(tx: DbLike, id: string) {
  const [row] = await tx.select().from(redirects).where(eq(redirects.id, id)).limit(1);
  if (!row) throw ApiError.notFound('Redirect not found');
  return row;
}

async function writtenRow(tx: DbLike, sourcePath: string) {
  const [row] = await tx.select().from(redirects).where(eq(redirects.sourcePath, sourcePath));
  if (!row) throw unprocessable(SELF, 'destination');
  return row;
}

const expire = () => revalidateTag(REDIRECTS_TAG, { expire: 0 });

export async function createManualRedirect(actor: Actor, input: RedirectInput): Promise<RedirectDto> {
  const dto = await db.transaction(async (tx) => {
    // Before the "taken" check, so concurrent same-source creates get a 409.
    await lockRedirects(tx);
    const [taken] = await tx
      .select({ id: redirects.id })
      .from(redirects)
      .where(eq(redirects.sourcePath, input.sourcePath));
    if (taken) {
      const message = 'A redirect from that address already exists';
      throw new ApiError(ERROR_CODES.CONFLICT, message, 409, { sourcePath: [message] });
    }
    await createRedirect(tx, {
      from: input.sourcePath,
      to: input.destination,
      statusCode: input.statusCode,
      note: input.note,
      createdBy: actor.userId,
    });
    const row = await writtenRow(tx, input.sourcePath);
    await audit(
      actor,
      {
        action: 'redirect.create',
        entityType: 'redirect',
        entityId: row.id,
        summary: `Redirect ${row.sourcePath} → ${row.destination}`,
      },
      tx,
    );
    return present(row);
  });
  expire();
  return dto;
}

export async function updateRedirect(actor: Actor, id: string, patch: RedirectPatch): Promise<RedirectDto> {
  const dto = await db.transaction(async (tx) => {
    await lockRedirects(tx);
    const before = await findRow(tx, id);
    // A new destination, or switching a row back on, goes through the flattening writer so
    // it can neither chain nor loop.
    const reactivated = patch.isActive === true && !before.isActive;
    if (patch.destination !== undefined || reactivated) {
      await createRedirect(tx, {
        from: before.sourcePath,
        to: patch.destination ?? before.destination,
        statusCode: patch.statusCode ?? before.statusCode,
        note: patch.note ?? before.note,
        createdBy: before.createdBy,
      });
    }
    await tx
      .update(redirects)
      .set({
        statusCode: patch.statusCode ?? before.statusCode,
        isActive: patch.isActive ?? before.isActive,
        note: patch.note ?? before.note,
      })
      .where(eq(redirects.id, id));
    const row = await writtenRow(tx, before.sourcePath);
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of ['destination', 'statusCode', 'isActive', 'note'] as const) {
      if (before[key] !== row[key]) diff[key] = { from: before[key], to: row[key] };
    }
    await audit(
      actor,
      {
        action: 'redirect.update',
        entityType: 'redirect',
        entityId: row.id,
        summary: `Updated redirect ${row.sourcePath} → ${row.destination}`,
        diff,
      },
      tx,
    );
    return present(row);
  });
  expire();
  return dto;
}

export async function deleteRedirect(actor: Actor, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await lockRedirects(tx);
    const row = await findRow(tx, id);
    await tx.delete(redirects).where(eq(redirects.id, id));
    await audit(
      actor,
      {
        action: 'redirect.delete',
        entityType: 'redirect',
        entityId: id,
        summary: `Removed redirect ${row.sourcePath} → ${row.destination}`,
      },
      tx,
    );
  });
  expire();
}

// After the response; hit counts are not cached, so no tag.
export async function recordHit(path: string): Promise<void> {
  await db
    .update(redirects)
    .set({ hitCount: sql`${redirects.hitCount} + 1`, lastHitAt: new Date() })
    .where(eq(redirects.sourcePath, path));
}
