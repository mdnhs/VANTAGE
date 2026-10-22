import 'server-only';

import { and, eq, inArray, isNull } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { redactForAudit } from '@/lib/audit/redact-for-audit';
import { topLevelDiff } from '@/lib/audit/top-level-diff';
import type { EditableGlobalKey } from '@/lib/content/global-access';
import { GLOBALS, parseGlobal } from '@/lib/content/globals';
import { collectMediaIds, mapRefs } from '@/lib/content/image-ref';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { media } from '@/server/db/schema/media';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { userName } from '@/server/lib/conflict';
import { assertMediaExists } from '@/server/lib/media/assert-media';
import { ApiError } from '@/server/lib/errors';
import { findRevision, listRevisions } from '@/server/lib/revisions';
import { invalid } from '@/server/lib/validator';
import { buildDocs } from '@/server/lib/settings/site-settings-migration';
import { PUBLIC_SETTINGS_KEYS, type PublicSettingsKey } from '@/server/lib/settings/public-settings';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { siteSettingsRepository } from '@/server/repositories/site-settings-repository';

const isLegacyKey = (key: string): key is PublicSettingsKey =>
  (PUBLIC_SETTINGS_KEYS as readonly string[]).includes(key);

// Drift-safe read: a malformed row yields the defaults at the stored version, so the next
// save heals it. A key that was never saved (version 0) shows what the public site shows:
// the legacy site_settings copy until the migration has run, else the defaults.
export async function readEffectiveGlobal<K extends EditableGlobalKey>(key: K) {
  const row = await settingsRepository.get(key);
  let source: unknown = row?.value;
  if (!row && isLegacyKey(key)) {
    const legacy = await siteSettingsRepository.get();
    try {
      if (legacy) source = buildDocs(legacy).docs[key];
    } catch (error) {
      console.warn(
        `[globals] legacy fallback for ${key} failed, using defaults:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  return { row, value: parseGlobal(key, source) };
}

export async function getGlobal<K extends EditableGlobalKey>(key: K) {
  const { row, value } = await readEffectiveGlobal(key);
  return {
    key,
    value,
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
  // A removed or foreign image must not be saved: every media ref has to be a live library row.
  await assertMediaExists(collectMediaIds(value));
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
          diff: topLevelDiff(redactForAudit(key, before?.value), redactForAudit(key, value)),
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

// Old snapshots may still hold Cloudinary refs. Those already copied into the library
// (`media.legacy_source`) become media refs; unknown ones stay Cloudinary refs.
async function translateLegacyRefs(snapshot: unknown): Promise<unknown> {
  const sourceOf = (publicId: string, path: string[]) =>
    `cloudinary:${path[path.length - 1] === 'video' ? 'video' : 'image'}:${publicId}`;
  const wanted = new Set<string>();
  mapRefs(snapshot, (ref, path) => {
    if (ref.kind === 'cloudinary') wanted.add(sourceOf(ref.publicId, path));
    return ref;
  });
  if (wanted.size === 0) return snapshot;
  const rows = await db
    .select({ id: media.id, legacySource: media.legacySource })
    .from(media)
    .where(and(inArray(media.legacySource, [...wanted]), isNull(media.deletedAt), eq(media.scope, 'library')));
  const bySource = new Map(rows.map((row) => [row.legacySource, row.id]));
  return mapRefs(snapshot, (ref, path) => {
    if (ref.kind !== 'cloudinary') return ref;
    const id = bySource.get(sourceOf(ref.publicId, path));
    return id ? { kind: 'media', id } : ref;
  });
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
    { version: input.version, value: await translateLegacyRefs(revision.snapshot) },
    `Restored version ${revision.version}`,
  );
}
