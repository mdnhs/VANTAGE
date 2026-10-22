import { Hono } from 'hono';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import type { AppEnv } from '@/server/api/types';
import { can, canAny } from '@/server/middleware/auth';
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

export const siteSettings = new Hono<AppEnv>()
  // Public read — CDN-cached, no auth, no database hit once the edge has a copy.
  .get('/', async (c) => {
    c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    const data = await siteSettingsService.getPublic();
    return ok(c, data);
  })

  .get('/admin', canAny({ page: ['read'] }, { settings: ['read'] }), async (c) => {
    const data = await siteSettingsService.getAdmin();
    return ok(c, data);
  })

  // One PATCH route per settings-page tab — each validates and writes only the columns
  // its own section owns, so saving one tab can never overwrite another's fields.
  .patch('/business-info', can({ settings: ['update'] }), zValidator('json', updateBusinessInfoSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateBusinessInfo(input);
    return ok(c, data);
  })

  .patch('/contact', can({ settings: ['update'] }), zValidator('json', updateContactSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateContact(input);
    return ok(c, data);
  })

  .patch('/social-links', can({ settings: ['update'] }), zValidator('json', updateSocialLinksSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateSocialLinks(input);
    return ok(c, data);
  })

  .patch('/branding', can({ settings: ['update'] }), zValidator('json', updateBrandingSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateBranding(input);
    return ok(c, data);
  })

  .patch('/hero-media', can({ page: ['update'] }), zValidator('json', updateHeroMediaSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateHeroMedia(input);
    return ok(c, data);
  })

  .patch('/seo', can({ seo: ['update'] }), zValidator('json', updateSeoSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateSeo(input);
    return ok(c, data);
  })

  .patch('/homepage-hero', can({ page: ['update'] }), zValidator('json', updateHomepageHeroSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateHomepageHero(input);
    return ok(c, data);
  })

  .patch('/homepage-catalog', can({ page: ['update'] }), zValidator('json', updateHomepageCatalogSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateHomepageCatalog(input);
    return ok(c, data);
  })

  .patch('/services-hero', can({ page: ['update'] }), zValidator('json', updateServicesHeroSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateServicesHero(input);
    return ok(c, data);
  })

  .patch('/our-work-hero', can({ page: ['update'] }), zValidator('json', updateOurWorkHeroSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateOurWorkHero(input);
    return ok(c, data);
  })

  .patch('/insurance-page', can({ page: ['update'] }), zValidator('json', updateInsurancePageSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateInsurancePage(input);
    return ok(c, data);
  })

  .patch('/about-page', can({ page: ['update'] }), zValidator('json', updateAboutPageSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateAboutPage(input);
    return ok(c, data);
  })

  .patch('/process-page', can({ page: ['update'] }), zValidator('json', updateProcessPageSchema), async (c) => {
    const input = c.req.valid('json');
    const data = await siteSettingsService.updateProcessPage(input);
    return ok(c, data);
  });
