import { Hono } from 'hono';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, requirePermission, type AuthEnv } from '@/server/middleware/auth';
import { PERMISSIONS } from '@/lib/permission/permissions';
import { siteSettingsService } from '@/server/services/site-settings-service';
import {
  updateBusinessInfoSchema,
  updateContactSchema,
  updateBrandingSchema,
  updateHeroMediaSchema,
  updateHomepageCatalogSchema,
  updateServicesHeroSchema,
  updateOurWorkHeroSchema,
  updateInsurancePageSchema,
  updateAboutPageSchema,
  updateProcessPageSchema,
  updateHomepageHeroSchema,
  updateSeoSchema,
  updateSocialLinksSchema,
} from '@/validations/site-settings-schema';

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

  // One PATCH route per settings-page tab — each validates and writes only the columns
  // its own section owns, so saving one tab can never overwrite another's fields.
  .patch(
    '/business-info',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateBusinessInfoSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateBusinessInfo(input);
      return ok(c, data);
    },
  )

  .patch(
    '/contact',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateContactSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateContact(input);
      return ok(c, data);
    },
  )

  .patch(
    '/social-links',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateSocialLinksSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateSocialLinks(input);
      return ok(c, data);
    },
  )

  .patch(
    '/branding',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateBrandingSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateBranding(input);
      return ok(c, data);
    },
  )

  .patch(
    '/hero-media',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateHeroMediaSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateHeroMedia(input);
      return ok(c, data);
    },
  )

  .patch(
    '/seo',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateSeoSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateSeo(input);
      return ok(c, data);
    },
  )

  .patch(
    '/homepage-hero',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateHomepageHeroSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateHomepageHero(input);
      return ok(c, data);
    },
  )

  .patch(
    '/homepage-catalog',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateHomepageCatalogSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateHomepageCatalog(input);
      return ok(c, data);
    },
  )

  .patch(
    '/services-hero',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateServicesHeroSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateServicesHero(input);
      return ok(c, data);
    },
  )

  .patch(
    '/our-work-hero',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateOurWorkHeroSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateOurWorkHero(input);
      return ok(c, data);
    },
  )

  .patch(
    '/insurance-page',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateInsurancePageSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateInsurancePage(input);
      return ok(c, data);
    },
  )

  .patch(
    '/about-page',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateAboutPageSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateAboutPage(input);
      return ok(c, data);
    },
  )

  .patch(
    '/process-page',
    requireAuth,
    requirePermission(PERMISSIONS.SETTINGS_MANAGE),
    zValidator('json', updateProcessPageSchema),
    async (c) => {
      const input = c.req.valid('json');
      const data = await siteSettingsService.updateProcessPage(input);
      return ok(c, data);
    },
  );
