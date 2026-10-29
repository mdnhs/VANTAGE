import 'server-only';

import { eq, inArray } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { topLevelDiff } from '@/lib/audit/top-level-diff';
import { presetAdminColours } from '@/lib/theme/admin';
import { checkTheme, describeIssue } from '@/lib/theme/checks';
import type { PresetId } from '@/lib/theme/presets';
import { parseTheme, ThemeConfig, type ThemeConfigValue } from '@/lib/theme/schema';
import { defaultSiteTheme } from '@/lib/theme/site';
import { db, type DbLike } from '@/server/db';
import { settings, users } from '@/server/db/schema';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { conflictCurrent, conflictError } from '@/server/lib/conflict';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { findRevision, listRevisions, writeRevision } from '@/server/lib/revisions';
import { invalid } from '@/server/lib/validator';

const KEY = 'theme';
type Row = typeof settings.$inferSelect;

// Drift-safe: a malformed stored value reads as the defaults, so the next save heals it.
function toDoc(row: Row | null) {
  const value = parseTheme(row?.value);
  const hasDraft = row?.draft != null;
  const draft = hasDraft ? parseTheme(row!.draft) : value;
  return {
    value,
    draft,
    hasDraft,
    version: row?.version ?? 0,
    updatedAt: row?.updatedAt ?? null,
    issues: checkTheme(draft),
  };
}
export type ThemeDoc = ReturnType<typeof toDoc>;

async function findRow(dbLike: DbLike, lock = false) {
  const query = dbLike.select().from(settings).where(eq(settings.key, KEY)).limit(1);
  const [row] = lock ? await query.for('update') : await query;
  return row ?? null;
}

// Optimistic guard: the stored version must equal the caller's (0 = no row yet).
async function lockAt(tx: DbLike, version: number) {
  const row = await findRow(tx, true);
  if ((row?.version ?? 0) !== version) throw conflictError(await conflictCurrent(tx, row));
  return row;
}

async function write(
  tx: DbLike,
  actor: Actor,
  before: Row | null,
  patch: { value?: ThemeConfigValue; draft: ThemeConfigValue | null },
) {
  if (before) {
    const [row] = await tx
      .update(settings)
      .set({ ...patch, version: before.version + 1, updatedBy: actor.userId, updatedAt: new Date() })
      .where(eq(settings.key, KEY))
      .returning();
    return row!;
  }
  const [row] = await tx
    .insert(settings)
    .values({
      key: KEY,
      value: patch.value ?? parseTheme({}),
      draft: patch.draft,
      version: 1,
      updatedBy: actor.userId,
    })
    .onConflictDoNothing()
    .returning();
  // Lost the race to a concurrent first save: report the winner.
  if (!row) throw conflictError(await conflictCurrent(tx, await findRow(tx)));
  return row;
}

function parseInput(input: unknown) {
  const parsed = ThemeConfig.safeParse(input ?? {});
  if (!parsed.success) throw invalid(parsed.error);
  return parsed.data;
}

export async function getThemeAdmin(): Promise<ThemeDoc> {
  return toDoc(await findRow(db));
}

// Draft saves are not audited, write no revision and expire nothing: draft-mode renders
// bypass the cache.
export async function saveThemeDraft(actor: Actor, input: { version: number; draft: unknown }) {
  const draft = parseInput(input.draft);
  const row = await db.transaction(async (tx) => write(tx, actor, await lockAt(tx, input.version), { draft }));
  return toDoc(row);
}

export async function publishTheme(actor: Actor, input: { version: number }) {
  const row = await db.transaction(async (tx) => {
    const before = await lockAt(tx, input.version);
    if (before?.draft == null) {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'There is no draft to publish', 422);
    }
    const next = parseTheme(before.draft);
    const issues = checkTheme(next);
    if (issues.length) {
      throw new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        `Some colours are too hard to read. ${issues.map(describeIssue).join(' ')}`,
        422,
        { colours: issues.map(describeIssue) },
      );
    }
    const saved = await write(tx, actor, before, { value: next, draft: null });
    await writeRevision(tx, {
      entityType: 'setting',
      entityId: KEY,
      version: saved.version,
      snapshot: next,
      createdBy: actor.userId,
      note: 'Published theme',
    });
    await audit(
      actor,
      {
        action: 'appearance.publish',
        entityType: 'setting',
        entityId: KEY,
        summary: 'Published the theme',
        diff: topLevelDiff(before?.value ?? null, next),
      },
      tx,
    );
    return saved;
  });
  // Stale theme is never served after a publish.
  revalidateTag(settingTag(KEY), { expire: 0 });
  return toDoc(row);
}

const resetSummary = (scope: 'site' | 'admin' | 'both', preset: PresetId) =>
  scope === 'site'
    ? 'Reset the site theme draft to the default'
    : `Reset the ${scope === 'both' ? 'theme' : 'admin theme'} draft to ${preset}`;

// Colours only: radius and mode stay. The site half always resets to the default.
export async function resetThemeDraft(
  actor: Actor,
  input: { version: number; preset: PresetId; scope: 'site' | 'admin' | 'both' },
) {
  const row = await db.transaction(async (tx) => {
    const before = await lockAt(tx, input.version);
    const current = parseTheme(before?.draft ?? before?.value);
    const draft: ThemeConfigValue = {
      site: input.scope === 'admin' ? current.site : defaultSiteTheme(),
      admin: input.scope === 'site' ? current.admin : { ...current.admin, ...presetAdminColours(input.preset) },
    };
    const saved = await write(tx, actor, before, { draft });
    await audit(
      actor,
      {
        action: 'appearance.reset',
        entityType: 'setting',
        entityId: KEY,
        summary: resetSummary(input.scope, input.preset),
      },
      tx,
    );
    return saved;
  });
  return toDoc(row);
}

export async function discardThemeDraft(actor: Actor, input: { version: number }) {
  const row = await db.transaction(async (tx) => {
    const before = await lockAt(tx, input.version);
    const saved = await write(tx, actor, before, { draft: null });
    await audit(
      actor,
      {
        action: 'appearance.discard',
        entityType: 'setting',
        entityId: KEY,
        summary: 'Discarded the theme draft',
      },
      tx,
    );
    return saved;
  });
  return toDoc(row);
}

export async function themeRevisions() {
  const { items } = await listRevisions(db, 'setting', KEY);
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

// Loads an old published theme into the draft; nothing goes live until Publish.
export async function restoreThemeRevision(actor: Actor, revisionId: string, version: number) {
  const revision = await findRevision(db, revisionId);
  if (!revision || revision.entityType !== 'setting' || revision.entityId !== KEY) {
    throw ApiError.notFound("That version doesn't exist");
  }
  // Re-validated: an old snapshot may predate a schema change.
  const draft = parseInput(revision.snapshot);
  const row = await db.transaction(async (tx) => {
    const before = await lockAt(tx, version);
    const saved = await write(tx, actor, before, { draft });
    await audit(
      actor,
      {
        action: 'appearance.restore',
        entityType: 'setting',
        entityId: KEY,
        summary: `Loaded theme version ${revision.version} into the draft`,
      },
      tx,
    );
    return saved;
  });
  return toDoc(row);
}
