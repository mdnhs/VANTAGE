// Paths are relative to `${NEXT_PUBLIC_API_PREFIX}${NEXT_PUBLIC_API_VERSION}` and are served by
// the Hono app in src/server/api. Keep them in sync with the `.route()` chain there.
export const API_ROUTES = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  health: '/health',
  // TODO: add feature route groups here as features are scaffolded
  // orders: {
  //   list: '/orders',
  //   create: '/orders',
  //   detail: (id: string) => `/orders/${id}`,
  //   update: (id: string) => `/orders/${id}`,
  // },
} as const;
