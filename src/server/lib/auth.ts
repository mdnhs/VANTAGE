import 'server-only';

import { getAuth, resetAuthForTests, type Auth } from './auth/auth';

export { getAuth, resetAuthForTests };
export type { Auth };

// Existing call sites use `auth.api.*` / `auth.handler`; resolve lazily so
// importing this module needs no secrets.
export const auth: Auth = new Proxy({} as Auth, {
  get: (_target, prop) => Reflect.get(getAuth(), prop),
});
