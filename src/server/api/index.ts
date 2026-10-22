import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { secureHeaders } from 'hono/secure-headers';
import { onError, onNotFound } from '@/server/middleware/error';
import { requestLogger } from '@/server/middleware/logger';
import { account } from './account';
import { adminAi } from './admin-ai';
import { adminGlobals } from './admin-globals';
import { adminMedia } from './admin-media';
import { adminSearch } from './admin-search';
import { adminUsers } from './admin-users';
import { adminUsersLookup } from './admin-users-lookup';
import { auth } from './auth';
import { contacts } from './contacts';
import { homepageCatalogs } from './homepage-catalogs';
import { homepagePillars } from './homepage-pillars';
import { homepageProcessSteps } from './homepage-process-steps';
import { media } from './media';
import { partnerLogos } from './partner-logos';
import { projects } from './projects';
import { quoteRequests } from './quote-requests';
import { services } from './services';
import { siteSettings } from './site-settings';
import { testimonials } from './testimonials';

const originOf = (url: string | undefined) => {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
};
const allowedOrigins = () =>
  [originOf(process.env.NEXT_PUBLIC_APP_URL), originOf(process.env.BETTER_AUTH_URL)].filter((o): o is string => !!o);

const app = new Hono().basePath('/api/v1');

app.use('*', secureHeaders());
// Writes must come from the app's own origin (the public quote and contact
// forms are same-origin posts too). GET/HEAD/OPTIONS are never checked.
app.use('*', csrf({ origin: (origin) => allowedOrigins().includes(origin) }));
app.use('*', requestLogger);

app.onError(onError);
app.notFound(onNotFound);

export const api = app
  // Static by design: no database, no session lookup. An external monitor pinging a
  // querying health check keeps the Neon endpoint awake 24/7 and bills full compute.
  .get('/health', (c) => {
    c.header('Cache-Control', 'public, s-maxage=60');
    return c.json({ success: true, data: { status: 'ok' } });
  })
  .route('/auth', auth)
  .route('/media', media)
  .route('/admin/media', adminMedia)
  .route('/admin/globals', adminGlobals)
  .route('/admin/users', adminUsers)
  .route('/admin/search', adminSearch)
  .route('/admin/ai', adminAi)
  .route('/account', account)
  .route('/admin', adminUsersLookup)
  .route('/site-settings', siteSettings)
  .route('/services', services)
  .route('/projects', projects)
  .route('/testimonials', testimonials)
  .route('/partner-logos', partnerLogos)
  .route('/homepage-pillars', homepagePillars)
  .route('/homepage-catalogs', homepageCatalogs)
  .route('/homepage-process-steps', homepageProcessSteps)
  .route('/quotes', quoteRequests)
  .route('/contacts', contacts);
// TODO: mount feature route modules here as they are scaffolded
// .route('/orders', orders)

// RPC type export — gives the frontend end-to-end types via hono/client.
export type ApiType = typeof api;
