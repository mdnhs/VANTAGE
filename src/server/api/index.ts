import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { onError, onNotFound } from '@/server/middleware/error';
import { requestLogger } from '@/server/middleware/logger';
import { auth } from './auth';

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
  .route('/auth', auth);
// TODO: mount feature route modules here as they are scaffolded
// .route('/orders', orders)

// RPC type export — gives the frontend end-to-end types via hono/client.
export type ApiType = typeof api;
