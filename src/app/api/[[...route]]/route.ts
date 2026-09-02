import { handle } from 'hono/vercel';
import { api } from '@/server/api';

// Node runtime is the default (Edge is opt-in), which is what the Neon serverless driver
// and crypto/auth libs need. With Cache Components enabled, route segment config exports
// (runtime/dynamic) are not allowed here — Hono's use of the request object makes every
// handler dynamic automatically.
export const GET = handle(api);
export const POST = handle(api);
export const PUT = handle(api);
export const PATCH = handle(api);
export const DELETE = handle(api);
export const OPTIONS = handle(api);
