import { Hono } from 'hono';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { updateSiteSettingsSchema } from '@/validations/site-settings-schema';

export const siteSettings = new Hono<AuthEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await siteSettingsService.getPublic();
    return ok(c, data);
  })

  .get('/admin', requireAuth, requirePermission(PERMISSIONS.SETTINGS_MANAGE), async (c) => {
    const data = await siteSettingsService.getAdmin();
    return ok(c, data);
  })

  .patch(
    '/',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateSiteSettingsSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.update(input);
      return ok(c, data);
    },
  );
