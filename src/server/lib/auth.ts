import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/server/db';
import { accounts, sessions, users, verifications } from '@/server/db/schema';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [appUrl],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Reads the session by signed cookie token first; only hits Neon when the
    // in-memory/cookie cache is stale, keeping the compute endpoint asleep on most requests.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
});
