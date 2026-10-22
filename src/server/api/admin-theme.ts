import { Hono } from 'hono';
import { z } from 'zod';

import { PRESET_IDS } from '@/lib/theme/presets';
import type { AppEnv } from '@/server/api/types';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorOf, can } from '@/server/middleware/auth';
import { notViewingAs, VIEW_AS_READ_ONLY } from '@/server/middleware/view-as';
import {
  discardThemeDraft,
  getThemeAdmin,
  publishTheme,
  resetThemeDraft,
  restoreThemeRevision,
  saveThemeDraft,
  themeRevisions,
} from '@/server/services/theme-service';

const Version = z.object({ version: z.number().int().min(0) });
const DraftInput = Version.extend({ draft: z.unknown() });
const ResetInput = Version.extend({
  preset: z.enum(PRESET_IDS),
  scope: z.enum(['site', 'admin', 'both']).default('both'),
});
const RevisionParam = z.object({ rev: z.uuid() });

export const adminTheme = new Hono<AppEnv>()
  .get('/', can({ appearance: ['read'] }), async (c) => ok(c, await getThemeAdmin()))

  .put(
    '/draft',
    can({ appearance: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('json', DraftInput),
    async (c) => ok(c, await saveThemeDraft(actorOf(c), c.req.valid('json'))),
  )

  .post(
    '/publish',
    can({ appearance: ['publish'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('json', Version),
    async (c) => ok(c, await publishTheme(actorOf(c), c.req.valid('json'))),
  )

  .post(
    '/reset',
    can({ appearance: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('json', ResetInput),
    async (c) => ok(c, await resetThemeDraft(actorOf(c), c.req.valid('json'))),
  )

  .post(
    '/discard',
    can({ appearance: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('json', Version),
    async (c) => ok(c, await discardThemeDraft(actorOf(c), c.req.valid('json'))),
  )

  .get('/revisions', can({ appearance: ['read'] }), async (c) => ok(c, await themeRevisions()))

  .post(
    '/revisions/:rev/restore',
    can({ appearance: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    zValidator('param', RevisionParam),
    zValidator('json', Version),
    async (c) => ok(c, await restoreThemeRevision(actorOf(c), c.req.valid('param').rev, c.req.valid('json').version)),
  );
