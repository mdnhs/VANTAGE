import 'server-only';
import { and, desc, eq, notInArray } from 'drizzle-orm';
import type { DbLike } from '@/server/db';
import { adminUsers, revisions } from '@/server/db/schema';

export const REVISION_LIMITS = { setting: 20, page: 50 } as const;
export type RevisionEntity = keyof typeof REVISION_LIMITS;

const of = (entityType: RevisionEntity, entityId: string) =>
  and(eq(revisions.entityType, entityType), eq(revisions.entityId, entityId));

// Rows written in one transaction share created_at, so version breaks ties.
const newestFirst = [desc(revisions.createdAt), desc(revisions.version)];

export async function writeRevision(
  db: DbLike,
  entry: {
    entityType: RevisionEntity;
    entityId: string;
    version: number;
    snapshot: unknown;
    note?: string | null;
    createdBy?: string | null;
  },
) {
  await db.insert(revisions).values({
    entityType: entry.entityType,
    entityId: entry.entityId,
    version: entry.version,
    snapshot: entry.snapshot,
    note: entry.note ?? null,
    createdBy: entry.createdBy ?? null,
  });
  const keep = db
    .select({ id: revisions.id })
    .from(revisions)
    .where(of(entry.entityType, entry.entityId))
    .orderBy(...newestFirst)
    .limit(REVISION_LIMITS[entry.entityType]);
  await db.delete(revisions).where(and(of(entry.entityType, entry.entityId), notInArray(revisions.id, keep)));
}

export async function listRevisions(db: DbLike, entityType: RevisionEntity, entityId: string) {
  const items = await db
    .select({
      id: revisions.id,
      version: revisions.version,
      note: revisions.note,
      createdAt: revisions.createdAt,
      createdBy: adminUsers.name,
    })
    .from(revisions)
    .leftJoin(adminUsers, eq(revisions.createdBy, adminUsers.id))
    .where(of(entityType, entityId))
    .orderBy(...newestFirst);
  return { items };
}

export async function findRevision(db: DbLike, id: string) {
  const [row] = await db.select().from(revisions).where(eq(revisions.id, id)).limit(1);
  return row ?? null;
}
