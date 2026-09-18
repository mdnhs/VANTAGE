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
    homePage: {
      index: '/dashboard/home-page',
    },
    // `index` points back at the relevant Home page tab — pillars/process steps/testimonials/
    // partner logos no longer have their own standalone list page, only create/edit (used by
    // the table's "Cancel").
    testimonials: {
      index: '/dashboard/home-page?tab=testimonials',
      create: '/dashboard/testimonials/create',
      edit: (id: string) => `/dashboard/testimonials/${id}/edit`,
    },
    partnerLogos: {
      index: '/dashboard/home-page?tab=partner-logos',
      create: '/dashboard/partner-logos/create',
      edit: (id: string) => `/dashboard/partner-logos/${id}/edit`,
    },
    homepagePillars: {
      index: '/dashboard/home-page?tab=pillars',
      create: '/dashboard/homepage-pillars/create',
      edit: (id: string) => `/dashboard/homepage-pillars/${id}/edit`,
    },
    homepageCatalogs: {
      index: '/dashboard/home-page?tab=catalog',
      create: '/dashboard/homepage-catalogs/create',
      edit: (id: string) => `/dashboard/homepage-catalogs/${id}/edit`,
    },
    homepageProcessSteps: {
      index: '/dashboard/home-page?tab=process',
      create: '/dashboard/homepage-process-steps/create',
      edit: (id: string) => `/dashboard/homepage-process-steps/${id}/edit`,
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
