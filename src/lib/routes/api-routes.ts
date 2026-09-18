// Paths are relative to `${NEXT_PUBLIC_API_PREFIX}${NEXT_PUBLIC_API_VERSION}` and are served by
// the Hono app in src/server/api. Keep them in sync with the `.route()` chain there.
export const API_ROUTES = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  health: '/health',
  media: {
    sign: '/media/sign',
    delete: (publicId: string) => `/media/${publicId}`,
  },
  siteSettings: {
    public: '/site-settings',
    admin: '/site-settings/admin',
    update: '/site-settings',
  },
  services: {
    public: '/services',
    adminList: '/services/admin/list',
    detail: (id: string) => `/services/${id}`,
    create: '/services',
    update: (id: string) => `/services/${id}`,
    remove: (id: string) => `/services/${id}`,
    reorder: '/services/reorder',
  },
  projects: {
    public: '/projects',
    featured: '/projects/featured',
    adminList: '/projects/admin/list',
    detail: (id: string) => `/projects/${id}`,
    create: '/projects',
    update: (id: string) => `/projects/${id}`,
    remove: (id: string) => `/projects/${id}`,
    updateStatus: (id: string) => `/projects/${id}/status`,
    reorder: '/projects/reorder',
  },
  testimonials: {
    public: '/testimonials',
    featured: '/testimonials/featured',
    adminList: '/testimonials/admin/list',
    detail: (id: string) => `/testimonials/${id}`,
    create: '/testimonials',
    update: (id: string) => `/testimonials/${id}`,
    remove: (id: string) => `/testimonials/${id}`,
    updateStatus: (id: string) => `/testimonials/${id}/status`,
    reorder: '/testimonials/reorder',
  },
  partnerLogos: {
    public: '/partner-logos',
    adminList: '/partner-logos/admin/list',
    detail: (id: string) => `/partner-logos/${id}`,
    create: '/partner-logos',
    update: (id: string) => `/partner-logos/${id}`,
    remove: (id: string) => `/partner-logos/${id}`,
    reorder: '/partner-logos/reorder',
  },
  admins: {
    list: '/admins',
    detail: (id: string) => `/admins/${id}`,
    create: '/admins',
    update: (id: string) => `/admins/${id}`,
    resetPassword: (id: string) => `/admins/${id}/password`,
  },
  // TODO: add feature route groups here as features are scaffolded
  // orders: {
  //   list: '/orders',
  //   create: '/orders',
  //   detail: (id: string) => `/orders/${id}`,
  //   update: (id: string) => `/orders/${id}`,
  // },
} as const;
