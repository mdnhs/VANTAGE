export const APP_ROUTES = {
  auth: {
    login: '/login',
  },
  dashboard: {
    index: '/dashboard',
  },
  content: {
    settings: {
      index: '/content/settings',
    },
    services: {
      index: '/content/services',
      create: '/content/services/create',
      edit: (id: string) => `/content/services/${id}/edit`,
    },
    projects: {
      index: '/content/projects',
      create: '/content/projects/create',
      edit: (id: string) => `/content/projects/${id}/edit`,
    },
    testimonials: {
      index: '/content/testimonials',
      create: '/content/testimonials/create',
      edit: (id: string) => `/content/testimonials/${id}/edit`,
    },
    partnerLogos: {
      index: '/content/partner-logos',
      create: '/content/partner-logos/create',
      edit: (id: string) => `/content/partner-logos/${id}/edit`,
    },
    admins: {
      index: '/content/admins',
      create: '/content/admins/create',
      edit: (id: string) => `/content/admins/${id}/edit`,
    },
  },
  // TODO: add feature app routes here as features are scaffolded
  // orders: {
  //   index: '/orders',
  //   create: '/orders/create',
  //   details: (id: string) => `/orders/${id}`,
  //   edit: (id: string) => `/orders/${id}/edit`,
  // },
} as const;
