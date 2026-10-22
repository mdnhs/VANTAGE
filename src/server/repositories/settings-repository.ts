import 'server-only';

import { eq } from 'drizzle-orm';
import { db, type DbLike } from '@/server/db';
import { settings, type Setting } from '@/server/db/schema';
import { conflictCurrent, conflictError } from '@/server/lib/conflict';
import { ApiError } from '@/server/lib/errors';
import { findRevision, writeRevision } from '@/server/lib/revisions';

type Saved = { before: Setting | null; after: Setting };

export const settingsRepository = {
  async get(key: string) {
    const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return row ?? null;
  },

  // Optimistic save: `version` must match the stored one (0 = key absent), else 409
  // carrying who holds the newer version. Every save writes a revision holding the
  // NEW value and version; `onSaved` runs in the same transaction (e.g. to audit).
  async save(
    key: string,
    input: { version: number; value: unknown },
    actorId: string | null,
    note?: string,
    onSaved?: (tx: DbLike, saved: Saved) => Promise<void>,
  ): Promise<{ version: number; updatedAt: Date }> {
    return db.transaction(async (tx) => {
      const [before] = await tx.select().from(settings).where(eq(settings.key, key)).limit(1).for('update');

      if ((before?.version ?? 0) !== input.version) throw conflictError(await conflictCurrent(tx, before ?? null));

      let after: Setting;
      if (before) {
        const [updated] = await tx
          .update(settings)
          .set({ value: input.value, version: before.version + 1, updatedBy: actorId, updatedAt: new Date() })
          .where(eq(settings.key, key))
          .returning();
        after = updated!;
      } else {
        const inserted = await tx
          .insert(settings)
          .values({ key, value: input.value, version: 1, updatedBy: actorId })
          .onConflictDoNothing()
          .returning();
        // Lost the race to a concurrent first save: report the winner.
        if (inserted.length === 0) {
          const [winner] = await tx.select().from(settings).where(eq(settings.key, key)).limit(1);
          throw conflictError(await conflictCurrent(tx, winner ?? null));
        }
        after = inserted[0]!;
      }

      await writeRevision(tx, {
        entityType: 'setting',
        entityId: key,
        version: after.version,
        snapshot: input.value,
        note,
        createdBy: actorId,
      });
      await onSaved?.(tx, { before: before ?? null, after });
      return { version: after.version, updatedAt: after.updatedAt };
    });
  },

  // Re-saves a stored snapshot as a new version. Callers that must re-validate the
  // snapshot (globals) do it themselves and use `save`.
  async restore(key: string, revisionId: string, actorId: string | null): Promise<{ version: number }> {
    const revision = await findRevision(db, revisionId);
    if (!revision || revision.entityType !== 'setting' || revision.entityId !== key) {
      throw ApiError.notFound("That version doesn't exist");
    }
    const current = await settingsRepository.get(key);
    return settingsRepository.save(
      key,
      { version: current?.version ?? 0, value: revision.snapshot },
      actorId,
      `Restored version ${revision.version}`,
    );
  },
};
