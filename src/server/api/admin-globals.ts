import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { z } from 'zod';

import { EDITABLE_GLOBAL_KEYS, GLOBAL_ACCESS } from '@/lib/content/global-access';
import type { AppEnv } from '@/server/api/types';
import { ApiError } from '@/server/lib/errors';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorOf, can } from '@/server/middleware/auth';
import { notViewingAs } from '@/server/middleware/view-as';
import { getGlobal, globalRevisions, restoreGlobal, saveGlobal } from '@/server/services/globals-service';

const KeyParam = z.object({ key: z.enum(EDITABLE_GLOBAL_KEYS) });
const RevisionParam = KeyParam.extend({ rev: z.uuid() });
const SaveInput = z.object({ version: z.number().int().min(0), value: z.unknown() });
const VersionInput = z.object({ version: z.number().int().min(0) });

const READ_ONLY_VIEW_AS = 'View-as is read-only: settings cannot be changed';

// The permission depends on the key, so the guard runs once the key is known.
// Unknown keys are a 404 before any permission check.
const canGlobal = (mode: 'read' | 'update') =>
  createMiddleware<AppEnv>(async (c, next) => {
    const parsed = KeyParam.safeParse({ key: c.req.param('key') });
    if (!parsed.success) throw ApiError.notFound('No such settings document');
    await can(GLOBAL_ACCESS[parsed.data.key][mode])(c, next);
  });

export const adminGlobals = new Hono<AppEnv>()
  .get('/:key', canGlobal('read'), zValidator('param', KeyParam), async (c) =>
    ok(c, await getGlobal(c.req.valid('param').key)),
  )

  .put(
    '/:key',
    canGlobal('update'),
    notViewingAs(READ_ONLY_VIEW_AS),
    zValidator('param', KeyParam),
    zValidator('json', SaveInput),
    async (c) => ok(c, await saveGlobal(actorOf(c), c.req.valid('param').key, c.req.valid('json'))),
  )

  .get('/:key/revisions', canGlobal('read'), zValidator('param', KeyParam), async (c) =>
    ok(c, await globalRevisions(c.req.valid('param').key)),
  )

  .post(
    '/:key/revisions/:rev/restore',
    canGlobal('update'),
    notViewingAs(READ_ONLY_VIEW_AS),
    zValidator('param', RevisionParam),
    zValidator('json', VersionInput),
    async (c) => {
      const { key, rev } = c.req.valid('param');
      return ok(c, await restoreGlobal(actorOf(c), key, rev, c.req.valid('json')));
    },
  );
