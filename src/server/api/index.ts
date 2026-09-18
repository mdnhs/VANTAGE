import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { onError, onNotFound } from '@/server/middleware/error';
import { requestLogger } from '@/server/middleware/logger';
import { admins } from './admins';
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
import { users } from './users';

const app = new Hono().basePath('/api/v1');

app.use('*', secureHeaders());
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
  .route('/site-settings', siteSettings)
  .route('/services', services)
  .route('/projects', projects)
  .route('/testimonials', testimonials)
  .route('/partner-logos', partnerLogos)
  .route('/homepage-pillars', homepagePillars)
  .route('/homepage-catalogs', homepageCatalogs)
  .route('/homepage-process-steps', homepageProcessSteps)
  .route('/quotes', quoteRequests)
  .route('/contacts', contacts)
  .route('/admins', admins)
  .route('/users', users);
// TODO: mount feature route modules here as they are scaffolded
// .route('/orders', orders)

// RPC type export — gives the frontend end-to-end types via hono/client.
export type ApiType = typeof api;
