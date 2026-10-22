import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '@/server/api/types';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorLimit } from '@/server/middleware/actor-limit';
import { actorOf, can } from '@/server/middleware/auth';
import { searchNavigation } from '@/server/services/admin-search-service';

const SearchQuery = z.object({ q: z.string().trim().max(100).default('') });

// ⌘K navigation search. The registry decides what each role may reach, so the
// permission here is only "may use the admin at all".
export const adminSearch = new Hono<AppEnv>().get(
  '/',
  can({ dashboard: ['view'] }),
  actorLimit('admin-search', { limit: 30, windowMs: 10_000 }),
  zValidator('query', SearchQuery),
  (c) => ok(c, { items: searchNavigation(actorOf(c).roles, c.req.valid('query').q) }),
);
