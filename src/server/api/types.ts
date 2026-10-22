import type { Actor } from '@/server/lib/auth/actor';

// Hono env for every router. `actor` is set by the guards in
// `@/server/middleware/auth` (null for anonymous callers).
export type AppEnv = { Variables: { actor: Actor | null } };
