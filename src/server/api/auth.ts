import { ok } from '@/server/lib/response';
import { Hono } from 'hono';
import type { AppEnv } from '@/server/api/types';
import { actorOf, signedIn } from '@/server/middleware/auth';
import { toMePayload } from '@/lib/auth/me';

// Sign-in, sign-out, password reset and two-factor all live in Better Auth (/api/auth/*).
// This router only exposes the current actor to the UI.
export const auth = new Hono<AppEnv>().get('/me', signedIn, async (c) => ok(c, toMePayload(actorOf(c))));
