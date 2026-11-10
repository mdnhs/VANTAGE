// Read-only check that the database really matches the code: every migration in the journal is
// recorded as applied, and every table and column in the latest schema snapshot exists.
//   DATABASE_URL=... yarn tsx scripts/db-verify.ts
// Writes nothing. Exits 1 and lists what is missing, so a silently skipped migration is caught.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { Pool } from 'pg';

const DIR = 'src/server/db/migrations';
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

type Entry = { idx: number; tag: string; when: number };
type Snapshot = { tables: Record<string, { name: string; schema: string; columns: Record<string, unknown> }> };

async function main() {
  const entries: Entry[] = JSON.parse(readFileSync(`${DIR}/meta/_journal.json`, 'utf8')).entries;
  const last = entries[entries.length - 1];
  const snapshot: Snapshot = JSON.parse(
    readFileSync(`${DIR}/meta/${String(last.idx).padStart(4, '0')}_snapshot.json`, 'utf8'),
  );
  const pool = new Pool({ connectionString: url, max: 1 });
  const problems: string[] = [];
  try {
    const applied = await pool.query<{ hash: string; created_at: string }>(
      'select hash, created_at from drizzle.__drizzle_migrations',
    );
    const hashes = new Set(applied.rows.map((r) => r.hash));
    for (const e of entries) {
      const sql = readFileSync(`${DIR}/${e.tag}.sql`, 'utf8');
      if (!hashes.has(createHash('sha256').update(sql).digest('hex'))) problems.push(`migration not applied: ${e.tag}`);
    }

    const cols = await pool.query<{ table_schema: string; table_name: string; column_name: string }>(
      "select table_schema, table_name, column_name from information_schema.columns where table_schema = 'public'",
    );
    const have = new Set(cols.rows.map((r) => `${r.table_schema}.${r.table_name}.${r.column_name}`));
    const tables = new Set(cols.rows.map((r) => `${r.table_schema}.${r.table_name}`));
    let columnCount = 0;
    for (const t of Object.values(snapshot.tables)) {
      const table = `${t.schema || 'public'}.${t.name}`;
      if (!tables.has(table)) problems.push(`missing table: ${table}`);
      for (const c of Object.keys(t.columns)) {
        columnCount++;
        if (!have.has(`${table}.${c}`)) problems.push(`missing column: ${table}.${c}`);
      }
    }
    console.log(
      `[verify] journal ${entries.length} (last ${last.tag}), recorded ${applied.rows.length}, ` +
        `${Object.keys(snapshot.tables).length} tables, ${columnCount} columns checked`,
    );
  } finally {
    await pool.end();
  }
  if (problems.length) {
    for (const p of problems) console.error(`[verify] ${p}`);
    process.exit(1);
  }
  console.log('[verify] OK: the database matches the code');
}

main().catch((error: unknown) => {
  console.error('[verify] failed:', error instanceof Error ? error.message : 'unknown error');
  process.exit(1);
});
