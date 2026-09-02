import { Hono } from 'hono';
import { ok } from '@/server/lib/response';
import { requireAuth, type AuthEnv } from '@/server/middleware/auth';

// TODO: implement login/logout once a session strategy is chosen (signed cookie / JWT).
// Keep the auth path DB-free per request — see src/server/middleware/auth.ts.
export const auth = new Hono<AuthEnv>()
  .post('/login', async (c) => ok(c, null))
  .post('/logout', async (c) => ok(c, null))
  .get('/me', requireAuth, async (c) => ok(c, c.get('user')));
