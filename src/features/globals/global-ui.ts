import type { FieldOverrides } from '@/components/admin/schema-form/to-fields';
import type { EditableGlobalKey } from '@/lib/content/global-access';
import { SEO_PAGE_FIELD_UI } from '@/features/seo/seo-field-ui';
import { MARKETING_FIELD_UI } from '@/features/marketing/marketing-field-ui';

// Admin labels and hints per global, as SchemaForm overrides keyed by dotted
// path ("links.$.label" is a list item's field). Plain data on purpose: the
// shared image/video ref schemas must not be re-registered, so labels for them
// live here. Keys not listed fall back to a humanised field name.
export const GLOBAL_FIELD_UI: Partial<Record<EditableGlobalKey, FieldOverrides>> = {
  site: {
    name: { label: 'Business name' },
    legalName: { label: 'Legal name', description: 'Used in legal pages and invoices (not shown on the site yet).' },
    logo: { label: 'Logo' },
    favicon: { label: 'Favicon' },
    lottieLogo: { label: 'Animated logo' },
    'lottieLogo.enabled': { label: 'Use the animated logo', description: 'Falls back to the logo when off.' },
    'lottieLogo.json': {
      widget: 'json-file',
      label: 'Lottie animation',
      description: 'A .json file exported from Lottie.',
    },
    social: { label: 'Social profiles' },
    'social.$.label': { label: 'Network' },
    'social.$.url': { label: 'Address', inputType: 'url', placeholder: 'https://' },
  },
  contact: {
    email: { inputType: 'email', label: 'Email' },
    'phone.display': { label: 'Phone (as shown)' },
    'phone.e164': {
      label: 'Phone in international format (E.164)',
      placeholder: '+35312345678',
      description: 'Used for phone links on the site when valid (e.g. +35312345678). Falls back to the display number.',
    },
    emergencyPhone: { label: 'Emergency phone', inputType: 'tel' },
    whatsapp: { label: 'WhatsApp number', inputType: 'tel' },
    'address.lines': { label: 'Address lines' },
    'address.eircode': { label: 'Eircode' },
    hours: { label: 'Opening hours' },
    'hours.weekly': { widget: 'weekly-hours-groups', label: 'Opening times' },
    'hours.note': { description: 'Internal note about the hours (not shown on the site yet).' },
    'hours.summary': { description: 'Leave blank to generate it from the opening times.' },
    mapUrl: { label: 'Map link', inputType: 'url', placeholder: 'https://' },
  },
  navigation: {
    links: { label: 'Header links' },
    'links.$.mobileOnly': { label: 'Mobile menu only' },
    cta: { label: 'Call to action' },
    'cta.shortLabel': { label: 'Short label', description: 'Used on small screens.' },
    'cta.mobileLabel': { label: 'Mobile menu label' },
    'cta.mobileHref': { label: 'Mobile menu link' },
  },
  footer: {
    columns: { label: 'Link columns' },
    'columns.$.links': { label: 'Links' },
    legalLinks: { label: 'Legal links' },
    legalNote: { description: 'Printed after the copyright name.' },
  },
  quoteForm: {
    'success.body': { description: '"{name}", "{vehicle}" and "{phone}" are replaced.' },
  },
  contactForm: {
    'success.body': { description: '"{name}" is replaced.' },
  },
  notifications: {
    recipients: { label: 'Recipients', description: 'New enquiries are emailed to these addresses.' },
    includeMessage: {
      label: 'Include the message in notification emails',
      description: 'Off by default: email copies leave the admin.',
    },
    autoReply: { label: 'Auto-reply to the customer' },
    'autoReply.enabled': {
      label: 'Send an auto-reply',
      description: 'Auto-replies go to whatever address is typed into the form.',
    },
    'autoReply.body': { description: 'The enquiry text is never added to the auto-reply.' },
  },
  seo: {
    titleTemplate: {
      label: 'Title template',
      description: '"%s" is replaced by the page title. Blank uses "%s | business name".',
    },
    defaultTitle: { label: 'Default title', description: 'Blank uses the business name.' },
    defaultDescription: {
      label: 'Default description',
      description: 'Blank uses the business name and opening hours.',
    },
    defaultOgImage: { label: 'Default share image' },
    twitterHandle: { label: 'X / Twitter handle' },
    'verification.google': { label: 'Google Search Console code' },
    'verification.bing': { label: 'Bing Webmaster code' },
    business: { label: 'Business details (structured data)' },
    'business.type': {
      label: 'Business type',
      widget: 'select',
      options: [
        { value: 'AutoBodyShop', label: 'Auto body shop' },
        { value: 'AutoRepair', label: 'Auto repair' },
        { value: 'LocalBusiness', label: 'Local business' },
      ],
    },
    'business.priceRange': { label: 'Price range', placeholder: '€€' },
    'business.sameAs': { label: 'Other profiles' },
  },
  privacy: {
    enquiryRetentionMonths: {
      label: 'Keep enquiries for (months)',
      description:
        'Only finished enquiries are deleted, counted from their last update: completed, cancelled or archived quotes with no billing data (no invoice number, status unpaid, nothing paid, no payment method), and replied or archived contact messages. New and in-progress enquiries are never deleted.',
    },
    spamRetentionDays: {
      label: 'Keep spam for (days)',
      description:
        'Applies to enquiries filed as spam, counted from their last update. A quote with invoice or payment records is never deleted.',
    },
  },
  'page.home': {
    hero: { label: 'Hero', description: 'The eyebrow badge, headline and subtext in the homepage hero.' },
    'hero.eyebrow': { label: 'Eyebrow badge text' },
    'hero.line1': { label: 'Headline line 1' },
    'hero.line2': { label: 'Headline line 2' },
    'hero.accent': { label: 'Headline accent line' },
    'hero.video': { label: 'Hero video', description: 'Background video, played when switched on below.' },
    'hero.fallbackImage': { label: 'Hero fallback image' },
    'hero.videoEnabled': { label: 'Play the hero video instead of the fallback image' },
    trustBadges: {
      label: 'Trust badges',
      description: 'The 4 items in the trust ticker under the hero buttons. Icons are fixed by position.',
    },
    catalog: { label: 'Catalog header', description: 'The copy above the homepage catalog grid.' },
    'catalog.eyebrow': { label: 'Eyebrow badge text' },
    'catalog.line1': { label: 'Headline line 1' },
    'catalog.accent': { label: 'Headline accent line' },
    'catalog.subtext': { label: 'Description' },
  },
  'page.services': {
    hero: { label: 'Hero' },
    'hero.eyebrow': { label: 'Eyebrow text' },
    'hero.line1': { label: 'Headline line 1' },
    'hero.accent': { label: 'Headline accent line' },
    'hero.subtext': { label: 'Description' },
  },
  'page.our-work': {
    hero: { label: 'Hero' },
    'hero.eyebrow': { label: 'Eyebrow text' },
    'hero.line1': { label: 'Headline line 1' },
    'hero.accent': { label: 'Headline accent line' },
    'hero.subtext': { label: 'Description' },
  },
  'page.insurance': {
    hero: { label: 'Hero' },
    'hero.eyebrow': { label: 'Eyebrow text' },
    'hero.line1': { label: 'Headline line 1' },
    'hero.line2': { label: 'Headline line 2' },
    'hero.line3': { label: 'Headline line 3' },
    'hero.subtext': {
      label: 'Description',
      description: 'Partner logos on this page are managed under Home page > Partner logos.',
    },
    coordination: { label: 'Coordination cards' },
    'coordination.features': {
      label: 'Cards',
      description: 'Icons are fixed by position (first three cards).',
    },
    steps: { label: 'Process steps', description: 'Step numbers follow the order below.' },
    'steps.items': { label: 'Steps' },
    cta: { label: 'Call to action' },
    'cta.line1': { label: 'Headline line 1' },
    'cta.accent': { label: 'Headline accent line' },
  },
  'page.about': {
    hero: { label: 'Hero', description: 'Headline reads: line 1 + accent 1, line 2 + accent 2.' },
    'hero.eyebrow': { label: 'Eyebrow text' },
    'hero.line1': { label: 'Headline line 1' },
    'hero.accent1': { label: 'Headline accent 1' },
    'hero.line2': { label: 'Headline line 2' },
    'hero.accent2': { label: 'Headline accent 2' },
    'hero.image': { label: 'Hero image', description: 'Empty shows the bundled photo.' },
    heritage: { label: 'Heritage' },
    'heritage.text': { label: 'Story' },
    'heritage.image': { label: 'Heritage image', description: 'Empty shows the bundled photo.' },
    'heritage.stat1': { label: 'First figure' },
    'heritage.stat2': { label: 'Second figure' },
    team: { label: 'Team' },
    'team.members': { label: 'Team members' },
    'team.members.$.image': { label: 'Photo', description: 'Empty shows the bundled photo.' },
    standards: { label: 'Standards' },
    'standards.image': { label: 'Standards image', description: 'Empty shows the bundled photo.' },
    'standards.title': {
      label: 'Title',
      widget: 'textarea',
      description: 'A line break is shown as a space; the last word is red.',
    },
    'standards.items': { label: 'Items' },
  },
  'page.process': {
    eyebrow: { label: 'Eyebrow text' },
    title: { label: 'Title', description: '"{count}" is replaced with the number of enabled steps.' },
  },
  ...MARKETING_FIELD_UI,
  ...SEO_PAGE_FIELD_UI,
};
