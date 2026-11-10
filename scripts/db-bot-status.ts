// Read-only: why does (or doesn't) the live-chat AI answer? Prints flags and counts only, never
// keys, message text or visitor details.   DATABASE_URL=... yarn tsx scripts/db-bot-status.ts
import { Pool } from 'pg';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

async function main() {
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const rows = await pool.query<{ key: string; value: Record<string, unknown>; version: number; updated_at: string }>(
      "select key, value, version, updated_at from settings where key in ('supportBot','ai')",
    );
    const byKey = Object.fromEntries(rows.rows.map((r) => [r.key, r]));
    const bot = byKey.supportBot;
    console.log(
      '[bot] supportBot row:',
      bot ? { value: bot.value, version: bot.version, at: bot.updated_at } : 'MISSING (defaults: disabled)',
    );
    const ai = byKey.ai?.value ?? {};
    console.log(
      '[bot] ai settings:',
      byKey.ai
        ? {
            provider: ai.provider,
            model: ai.model,
            hasBaseUrl: Boolean(ai.baseUrl),
            hasApiKey: Boolean(ai.apiKeyEncrypted),
            keys: Object.keys(ai),
          }
        : 'MISSING',
    );
    const chats = await pool.query(
      `select c.status, c.ai_enabled, c.needs_human, c.assigned_to is not null as assigned, c.created_at,
              count(*) filter (where m.sender='visitor') v, count(*) filter (where m.sender='ai') a,
              count(*) filter (where m.sender='staff') s, count(*) filter (where m.sender='system') sy
         from support_conversations c left join support_messages m on m.conversation_id = c.id
        group by c.id order by c.created_at desc limit 6`,
    );
    console.table(chats.rows);
  } finally {
    await pool.end();
  }
}
main().catch((e: unknown) => {
  console.error('[bot] failed:', e instanceof Error ? e.message : 'error');
  process.exit(1);
});
