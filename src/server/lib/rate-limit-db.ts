import 'server-only';

import { sql } from 'drizzle-orm';

import { db, type DbLike } from '@/server/db';

// Per-actor API limits, kept in Postgres so they survive restarts and hold
// across serverless instances. Shares Better Auth's `rate_limits` table under
// an `api:` key prefix. One atomic upsert per hit, so concurrent requests can
// never both read "4" and both pass. The window opens at the first hit and
// resets once `windowMs` has passed.
export async function hitLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now = Date.now(),
  dbLike: DbLike = db,
) {
  const id = `api:${key}`;
  const cutoff = now - windowMs;
  const { rows } = await dbLike.execute<{ count: number; last_request: string }>(sql`
    insert into rate_limits (id, key, count, last_request)
    values (${id}, ${id}, 1, ${now}::bigint)
    on conflict (key) do update set
      count = case when rate_limits.last_request <= ${cutoff}::bigint then 1 else rate_limits.count + 1 end,
      last_request = case when rate_limits.last_request <= ${cutoff}::bigint then ${now}::bigint else rate_limits.last_request end
    returning count, last_request`);
  const row = rows[0]!;
  const allowed = row.count <= limit;
  const retryAfterSec = allowed ? 0 : Math.max(1, Math.ceil((Number(row.last_request) + windowMs - now) / 1000));
  return { allowed, retryAfterSec };
}
