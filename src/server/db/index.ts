import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/postgres';

// Plain Postgres over the regular wire protocol (node-postgres). SSL is driven by the
// connection string (`?sslmode=require` for a remote server). The pool is cached on
// globalThis so dev HMR reloads reuse it instead of leaking a new pool per reload.
// Keep `max` small: every serverless instance holds its own pool, so total connections
// = instances × max — size DB_POOL_MAX against the server's max_connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema, logger: process.env.NODE_ENV === 'development' });

export type Db = typeof db;
export { schema };

// Either the pool-backed client or a transaction handle, so helpers work in both.
export type DbLike = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
