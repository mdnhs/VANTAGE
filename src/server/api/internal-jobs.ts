import { timingSafeEqual } from 'node:crypto';

import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';

import type { AppEnv } from '@/server/api/types';
import { ApiError } from '@/server/lib/errors';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { rateLimit } from '@/server/middleware/rate-limit';
import { runDailyRetention } from '@/server/services/daily-retention-service';

const matches = (given: string, expected: string) => {
  const [a, b] = [Buffer.from(given), Buffer.from(expected)];
  return a.length === b.length && timingSafeEqual(a, b);
};

// Called from inside the production container by a Dokploy schedule, which already has AUTH_SECRET.
// The image has no scripts or yarn to run the job with. Anyone else gets a plain 404.
const jobKey = createMiddleware<AppEnv>(async (c, next) => {
  const expected = process.env.AUTH_SECRET;
  if (!expected || !matches(c.req.header('x-job-key') ?? '', expected)) throw ApiError.notFound('Route not found');
  await next();
});

export const internalJobs = new Hono<AppEnv>().post(
  '/retention',
  rateLimit(10, 60_000),
  jobKey,
  zValidator('query', z.object({ dryRun: z.literal('1').optional() })),
  async (c) => ok(c, await runDailyRetention({ dryRun: c.req.valid('query').dryRun === '1' })),
);
