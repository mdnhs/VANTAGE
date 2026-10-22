import 'server-only';

import { inArray } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { topLevelDiff } from '@/lib/audit/top-level-diff';
import type { EditableGlobalKey } from '@/lib/content/global-access';
import { GLOBALS, parseGlobal } from '@/lib/content/globals';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { userName } from '@/server/lib/conflict';
import { ApiError } from '@/server/lib/errors';
import { findRevision, listRevisions } from '@/server/lib/revisions';
import { invalid } from '@/server/lib/validator';
import { settingsRepository } from '@/server/repositories/settings-repository';

// Drift-safe read: a missing or malformed row yields the defaults at the stored
// version (0 = never saved), so the next save heals it.
export async function getGlobal<K extends EditableGlobalKey>(key: K) {
  const row = await settingsRepository.get(key);
  return {
    key,
    value: parseGlobal(key, row?.value),
    version: row?.version ?? 0,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: await userName(db, row?.updatedBy ?? null),
  };
}

// Globals go live on save: validate, version-guard (409 on a stale version),
// snapshot the new value (20 kept), audit with a top-level diff, expire the one tag.
export async function saveGlobal(
  actor: Actor,
  key: EditableGlobalKey,
  input: { version: number; value: unknown },
  note?: string,
) {
  const parsed = GLOBALS[key].safeParse(input.value);
  if (!parsed.success) throw invalid(parsed.error);
  const value = parsed.data;
  const saved = await settingsRepository.save(
    key,
    { version: input.version, value },
    actor.userId,
    note,
    (tx, { before }) =>
      audit(
        actor,
        {
          action: 'globals.update',
          entityType: 'setting',
          entityId: key,
          summary: note ?? `Updated ${key}`,
          diff: topLevelDiff(before?.value, value),
        },
        tx,
      ),
  );
  // Stale content is never served after a save: changes go live immediately.
  revalidateTag(settingTag(key), { expire: 0 });
  return { key, value, version: saved.version, updatedAt: saved.updatedAt };
}

export async function globalRevisions(key: EditableGlobalKey) {
  const { items } = await listRevisions(db, 'setting', key);
  const ids = [...new Set(items.map((item) => item.createdBy).filter((id): id is string => !!id))];
  const rows = ids.length
    ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ids))
    : [];
  const names = new Map(rows.map((row) => [row.id, row.name]));
  return {
    items: items.map((item) => ({
      ...item,
      createdByName: item.createdBy ? (names.get(item.createdBy) ?? null) : null,
    })),
  };
}

// Restores re-validate: an old snapshot may predate a schema change. The result is
// saved as a NEW version (version + 1) with the note "Restored version N".
export async function restoreGlobal(
  actor: Actor,
  key: EditableGlobalKey,
  revisionId: string,
  input: { version: number },
) {
  const revision = await findRevision(db, revisionId);
  if (!revision || revision.entityType !== 'setting' || revision.entityId !== key) {
    throw ApiError.notFound("That version doesn't exist");
  }
  return saveGlobal(
    actor,
    key,
    { version: input.version, value: revision.snapshot },
    `Restored version ${revision.version}`,
  );
}
