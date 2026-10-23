import { Hono } from 'hono';
import { ok } from '@/server/lib/response';
import type { AppEnv } from '@/server/api/types';
import { siteSettingsService } from '@/server/services/site-settings-service';

// Public read only. Every edit goes through the versioned `/admin/globals/:key` API.
export const siteSettings = new Hono<AppEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'no-store');
    const data = await siteSettingsService.getPublic();
    return ok(c, data);
  });
