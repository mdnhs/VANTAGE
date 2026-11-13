export const APP_ROUTES = {
  auth: {
    login: '/login',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    twoFactor: '/two-factor',
    twoFactorSetup: '/two-factor-setup',
  },
  dashboard: {
    index: '/dashboard',
    account: '/dashboard/account',
    accountSecurity: '/dashboard/account?tab=security',
  },
  content: {
    settings: {
      index: '/dashboard/settings',
    },
    services: {
      index: '/dashboard/website/services',
      create: '/dashboard/website/services/create',
      edit: (id: string) => `/dashboard/website/services/${id}/edit`,
    },
    legalPages: {
      index: '/dashboard/website/legal-pages',
      create: '/dashboard/website/legal-pages/create',
      edit: (id: string) => `/dashboard/website/legal-pages/${id}/edit`,
    },
    projects: {
      index: '/dashboard/website/projects',
      create: '/dashboard/website/projects/create',
      edit: (id: string) => `/dashboard/website/projects/${id}/edit`,
    },
    homePage: {
      index: '/dashboard/website/home-page',
    },
    insurance: {
      index: '/dashboard/website/insurance',
    },
    about: {
      index: '/dashboard/website/about',
    },
    processPage: {
      index: '/dashboard/website/process-page',
    },
    contactPage: {
      index: '/dashboard/website/contact-page',
    },
    // `index` points back at the relevant Home page tab — process steps/testimonials/
    // partner logos no longer have their own standalone list page, only create/edit (used by
    // the table's "Cancel").
    testimonials: {
      index: '/dashboard/website/home-page?tab=testimonials',
      create: '/dashboard/website/testimonials/create',
      edit: (id: string) => `/dashboard/website/testimonials/${id}/edit`,
    },
    partnerLogos: {
      index: '/dashboard/website/home-page?tab=partner-logos',
      create: '/dashboard/website/partner-logos/create',
      edit: (id: string) => `/dashboard/website/partner-logos/${id}/edit`,
    },
    homepageCatalogs: {
      index: '/dashboard/website/home-page?tab=catalog',
      create: '/dashboard/website/homepage-catalogs/create',
      edit: (id: string) => `/dashboard/website/homepage-catalogs/${id}/edit`,
    },
    homepageProcessSteps: {
      index: '/dashboard/website/home-page?tab=process',
      create: '/dashboard/website/homepage-process-steps/create',
      edit: (id: string) => `/dashboard/website/homepage-process-steps/${id}/edit`,
    },
    users: {
      index: '/dashboard/users',
    },
  },
  leads: {
    quotes: {
      index: '/dashboard/enquiries/quotes',
      details: (id: string) => `/dashboard/enquiries/quotes/${id}`,
    },
    contacts: {
      index: '/dashboard/enquiries/contacts',
      details: (id: string) => `/dashboard/enquiries/contacts/${id}`,
    },
    support: {
      index: '/dashboard/support',
      conversation: (id: string) => `/dashboard/support?c=${id}`,
    },
  },
} as const;
