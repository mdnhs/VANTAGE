import { eq } from 'drizzle-orm';

import type { DbLike } from '@/server/db';
import { users } from '@/server/db/schema';
import { ApiError, type ConflictCurrent } from '@/server/lib/errors';

export const CONFLICT_MESSAGE = 'Someone else saved a moment ago';

// 409. With `current`, the client learns the newest version and who saved it,
// so it can reload instead of overwriting.
export function conflictError(current?: ConflictCurrent) {
  return new ApiError('CONFLICT', CONFLICT_MESSAGE, 409, undefined, current);
}

export async function userName(db: DbLike, id: string | null): Promise<string | null> {
  if (!id) return null;
  const [row] = await db.select({ name: users.name }).from(users).where(eq(users.id, id)).limit(1);
  return row?.name ?? null;
}

// The conflict payload for a stored row (null = the key does not exist yet).
export async function conflictCurrent(
  db: DbLike,
  row: { version: number; updatedAt: Date | null; updatedBy: string | null } | null,
): Promise<ConflictCurrent> {
  return {
    version: row?.version ?? 0,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
    updatedBy: await userName(db, row?.updatedBy ?? null),
  };
}
