export const APP_ROUTES = {
  auth: {
    login: '/login',
  },
  dashboard: {
    index: '/dashboard',
  },
  content: {
    settings: {
      index: '/dashboard/settings',
    },
    services: {
      index: '/dashboard/services',
      create: '/dashboard/services/create',
      edit: (id: string) => `/dashboard/services/${id}/edit`,
    },
    projects: {
      index: '/dashboard/projects',
      create: '/dashboard/projects/create',
      edit: (id: string) => `/dashboard/projects/${id}/edit`,
    },
    testimonials: {
      index: '/dashboard/testimonials',
      create: '/dashboard/testimonials/create',
      edit: (id: string) => `/dashboard/testimonials/${id}/edit`,
    },
    partnerLogos: {
      index: '/dashboard/partner-logos',
      create: '/dashboard/partner-logos/create',
      edit: (id: string) => `/dashboard/partner-logos/${id}/edit`,
    },
    admins: {
      index: '/dashboard/admins',
      create: '/dashboard/admins/create',
      edit: (id: string) => `/dashboard/admins/${id}/edit`,
    },
  },
  // TODO: add feature app routes here as features are scaffolded
  // orders: {
  //   index: '/dashboard/orders',
  //   create: '/dashboard/orders/create',
  //   details: (id: string) => `/dashboard/orders/${id}`,
  //   edit: (id: string) => `/dashboard/orders/${id}/edit`,
  // },
} as const;
