import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const isLocalPostgres = /^(localhost|127\.0\.0\.1)(:|\/)/.test(new URL(connectionString).host);

// Local dev talks to a plain Postgres server over the regular wire protocol (node-postgres) —
// @neondatabase/serverless's neon-http driver only speaks Neon's HTTP proxy protocol, which a
// vanilla local Postgres doesn't implement. Everywhere else (a real Neon endpoint) keeps using
// neon-http: one stateless HTTP round trip per query, nothing held open, so the compute endpoint
// can suspend the instant the query returns — this is why we do NOT use a WebSocket Pool there.
export const db = isLocalPostgres
  ? drizzleNodePostgres(new Pool({ connectionString }), { schema, logger: process.env.NODE_ENV === 'development' })
  : drizzleNeonHttp(neon(connectionString), { schema, logger: process.env.NODE_ENV === 'development' });

export type Db = typeof db;
export { schema };
