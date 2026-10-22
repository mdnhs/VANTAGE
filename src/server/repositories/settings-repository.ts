import { and, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { settings } from '@/server/db/schema';
import { conflictError } from '@/server/lib/conflict';
import { ApiError } from '@/server/lib/errors';
import { findRevision, writeRevision } from '@/server/lib/revisions';

export const settingsRepository = {
  async get(key: string) {
    const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return row ?? null;
  },

  // Optimistic save: `version` must match the stored one (0 = key absent).
  async save(
    key: string,
    input: { version: number; value: unknown },
    actorId: string | null,
    note?: string,
  ): Promise<{ version: number }> {
    return db.transaction(async (tx) => {
      const [before] = await tx.select().from(settings).where(eq(settings.key, key)).limit(1).for('update');

      if (!before) {
        if (input.version !== 0) throw conflictError();
        const inserted = await tx
          .insert(settings)
          .values({ key, value: input.value, version: 1, updatedBy: actorId })
          .onConflictDoNothing()
          .returning({ version: settings.version });
        if (inserted.length === 0) throw conflictError();
        return { version: 1 };
      }

      const updated = await tx
        .update(settings)
        .set({ value: input.value, version: input.version + 1, updatedBy: actorId, updatedAt: new Date() })
        .where(and(eq(settings.key, key), eq(settings.version, input.version)))
        .returning({ version: settings.version });
      if (updated.length === 0) throw conflictError();

      await writeRevision(tx, {
        entityType: 'setting',
        entityId: key,
        version: before.version,
        snapshot: before.value,
        note,
        createdBy: actorId,
      });
      return { version: updated[0]!.version };
    });
  },

  async restore(key: string, revisionId: string, actorId: string | null): Promise<{ version: number }> {
    const revision = await findRevision(db, revisionId);
    if (!revision || revision.entityType !== 'setting' || revision.entityId !== key) {
      throw ApiError.notFound("That version doesn't exist");
    }
    const current = await this.get(key);
    return this.save(
      key,
      { version: current?.version ?? 0, value: revision.snapshot },
      actorId,
      `Restored version ${revision.version} of ${key}`,
    );
  },
};
