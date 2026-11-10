import { and, asc, eq, lt, sql } from 'drizzle-orm';

import { db } from '@/server/db';
import { supportKnowledge, supportKnowledgeSync } from '@/server/db/schema';

export type KnowledgeChunk = { source: string; sourceKey: string; title: string; body: string; core?: boolean };
export type KnowledgeRow = { title: string; body: string; source: string; sourceKey: string };

const SYNC_ID = 'main';
// A run that never finished (server restarted mid-sync) stops blocking a new one after this long.
export const SYNC_STALE_MS = 5 * 60_000;

// Only letters and digits survive, so the query text can never inject tsquery syntax.
const tsQueryOf = (text: string) => {
  const words = [...new Set(text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [])].slice(0, 14);
  return words.join(' | ');
};

export const supportKnowledgeRepository = {
  async syncRow() {
    const [row] = await db.select().from(supportKnowledgeSync).where(eq(supportKnowledgeSync.id, SYNC_ID)).limit(1);
    return row ?? null;
  },

  // Atomic: returns the start time only to the one caller that got the lock.
  async tryStart(total: number, startedBy: string | null): Promise<Date | null> {
    const startedAt = new Date();
    await db.insert(supportKnowledgeSync).values({ id: SYNC_ID }).onConflictDoNothing();
    const stale = new Date(startedAt.getTime() - SYNC_STALE_MS);
    const rows = await db
      .update(supportKnowledgeSync)
      .set({
        status: 'running',
        step: 'Starting',
        total,
        done: 0,
        chunks: 0,
        error: null,
        startedAt,
        finishedAt: null,
        startedBy,
      })
      .where(
        and(
          eq(supportKnowledgeSync.id, SYNC_ID),
          sql`(${supportKnowledgeSync.status} <> 'running' or ${supportKnowledgeSync.startedAt} < ${stale})`,
        ),
      )
      .returning({ id: supportKnowledgeSync.id });
    return rows.length ? startedAt : null;
  },

  async progress(patch: { step?: string; done?: number; chunks?: number }) {
    await db.update(supportKnowledgeSync).set(patch).where(eq(supportKnowledgeSync.id, SYNC_ID));
  },

  async finish(result: { ok: true; chunks: number } | { ok: false; error: string }) {
    await db
      .update(supportKnowledgeSync)
      .set(
        result.ok
          ? { status: 'done', step: 'Done', chunks: result.chunks, error: null, finishedAt: new Date() }
          : { status: 'failed', step: 'Failed', error: result.error, finishedAt: new Date() },
      )
      .where(eq(supportKnowledgeSync.id, SYNC_ID));
  },

  async upsert(chunks: KnowledgeChunk[], syncedAt: Date) {
    for (const c of chunks) {
      await db
        .insert(supportKnowledge)
        .values({ ...c, core: c.core ?? false, syncedAt })
        .onConflictDoUpdate({
          target: [supportKnowledge.source, supportKnowledge.sourceKey],
          set: { title: c.title, body: c.body, core: c.core ?? false, syncedAt },
        });
    }
  },

  // Rows this run did not write are content that no longer exists on the site.
  async deleteOlderThan(startedAt: Date) {
    await db.delete(supportKnowledge).where(lt(supportKnowledge.syncedAt, startedAt));
  },

  async count() {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(supportKnowledge);
    return row?.n ?? 0;
  },

  async core(): Promise<KnowledgeRow[]> {
    return db
      .select({
        title: supportKnowledge.title,
        body: supportKnowledge.body,
        source: supportKnowledge.source,
        sourceKey: supportKnowledge.sourceKey,
      })
      .from(supportKnowledge)
      .where(eq(supportKnowledge.core, true))
      .orderBy(asc(supportKnowledge.source), asc(supportKnowledge.sourceKey));
  },

  // The pieces that best match the question, best first. Empty when nothing matches.
  async search(query: string, limit: number): Promise<KnowledgeRow[]> {
    const q = tsQueryOf(query);
    if (!q) return [];
    const doc = sql`to_tsvector('english', ${supportKnowledge.title} || ' ' || ${supportKnowledge.body})`;
    const tsq = sql`to_tsquery('english', ${q})`;
    return db
      .select({
        title: supportKnowledge.title,
        body: supportKnowledge.body,
        source: supportKnowledge.source,
        sourceKey: supportKnowledge.sourceKey,
      })
      .from(supportKnowledge)
      .where(and(eq(supportKnowledge.core, false), sql`${doc} @@ ${tsq}`))
      .orderBy(sql`ts_rank(${doc}, ${tsq}) desc`)
      .limit(limit);
  },

  async ofSource(source: string, limit: number): Promise<KnowledgeRow[]> {
    return db
      .select({
        title: supportKnowledge.title,
        body: supportKnowledge.body,
        source: supportKnowledge.source,
        sourceKey: supportKnowledge.sourceKey,
      })
      .from(supportKnowledge)
      .where(and(eq(supportKnowledge.source, source), eq(supportKnowledge.core, false)))
      .orderBy(asc(supportKnowledge.sourceKey))
      .limit(limit);
  },

  // When any content the AI learns from last changed; compared with the last sync to say "out of date".
  async contentChangedAt(): Promise<Date | null> {
    const result = await db.execute<{ at: string | null }>(sql`
      select max(at) as at from (
        select max(updated_at) as at from services
        union all select max(updated_at) from projects
        union all select max(updated_at) from testimonials
        union all select max(updated_at) from homepage_process_steps
        union all select max(updated_at) from settings where key in ('site','contact') or key like 'page.%'
      ) t`);
    const at = result.rows[0]?.at;
    return at ? new Date(at) : null;
  },
};
