import { createMiddleware } from 'hono/factory';

const isDebug = () => process.env.NODE_ENV === 'development' || process.env.DEBUG_API === 'true';

export const requestLogger = createMiddleware(async (c, next) => {
  if (!isDebug()) return next();
  const start = Date.now();
  await next();
  console.log(`[api] ${c.req.method} ${c.req.path} → ${c.res.status} (${Date.now() - start}ms)`);
});
