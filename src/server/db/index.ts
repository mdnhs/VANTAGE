import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

// neon-http: one stateless HTTP round trip per query, nothing held open — so the compute
// endpoint can suspend the instant the query returns. This is the cheap default and it is
// why we do NOT use a WebSocket Pool: an open pool keeps the endpoint awake and billing.
const sql = neon(connectionString);

export const db = drizzle(sql, { schema, logger: process.env.NODE_ENV === 'development' });
export type Db = typeof db;
export { schema };
