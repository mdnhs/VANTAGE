import type { FieldOverrides } from '@/components/admin/schema-form/to-fields';
import type { EditableGlobalKey } from '@/lib/content/global-access';
import { SEO_PAGE_FIELD_UI } from '@/features/seo/seo-field-ui';
import { MARKETING_FIELD_UI } from '@/features/marketing/marketing-field-ui';

// Shared wording for the copy every page section repeats, so the same thing has one name.
const BADGE = {
  label: 'Small label above the title',
  description: 'The short pill-shaped tag over the title.',
  widget: 'text',
} as const;
const SUBTEXT = { label: 'Text under the title' } as const;

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
    llms: {
      label: 'AI assistants (llms.txt)',
      description: 'A plain-text summary of the site at /llms.txt that AI search tools read.',
    },
    'llms.enabled': { label: 'Publish /llms.txt' },
    'llms.summary': {
      label: 'Summary',
      widget: 'textarea',
      description: 'Who you are and what you do, in a few sentences. Blank uses the default description.',
    },
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
    hero: {
      label: 'Top banner',
      description: 'The first thing visitors see on the homepage, over the video or photo.',
    },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.line2': { label: 'Title — line 2', description: 'White.' },
    'hero.accent': { label: 'Title — line 3', description: 'Red.' },
    'hero.subtext': SUBTEXT,
    'hero.video': { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    'hero.fallbackImage': {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads on slow connections.',
    },
    'hero.videoEnabled': { label: 'Play the video instead of the photo' },
    trustBadges: {
      label: 'Trust ticker',
      description:
        'The 4 short facts scrolling under the banner buttons. Icons follow the order and cannot be changed.',
    },
    'trustBadges.$': { label: 'Fact' },
    'trustBadges.$.title': { label: 'Main text' },
    'trustBadges.$.subtitle': { label: 'Small text under it' },
    catalog: { label: 'Services grid heading', description: 'The heading above the grid of service cards.' },
    'catalog.eyebrow': BADGE,
    'catalog.line1': { label: 'Title', description: 'White.' },
    'catalog.accent': { label: 'Title — red part', description: 'Red, after the white part.' },
    'catalog.subtext': SUBTEXT,
  },
  'page.services': {
    hero: { label: 'Top banner', description: 'The dark banner at the top of the Services page.' },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.accent': { label: 'Title — line 2', description: 'Red.' },
    'hero.subtext': SUBTEXT,
    faq: { label: 'FAQ', description: 'Below the list of services. Remove every question to hide the section.' },
    'faq.eyebrow': BADGE,
    'faq.title': { label: 'Title', description: 'White.' },
    'faq.accent': { label: 'Title — red part', description: 'Red, after the white part.' },
    'faq.items': {
      label: 'Questions',
      description: 'Shown in this order; visitors click a question to open its answer.',
    },
    'faq.items.$': { label: 'Question' },
    'faq.items.$.question': { label: 'Question', widget: 'text' },
    'faq.items.$.answer': { label: 'Answer' },
  },
  'page.our-work': {
    hero: { label: 'Top banner', description: 'The dark banner at the top of the Our Work page.' },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.accent': { label: 'Title — line 2', description: 'Red.' },
    'hero.subtext': SUBTEXT,
  },
  'page.insurance': {
    hero: { label: 'Top banner', description: 'The dark banner at the top of the Insurance page.' },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.line2': { label: 'Title — line 2', description: 'White.' },
    'hero.line3': { label: 'Title — line 3', description: 'Red.' },
    'hero.subtext': {
      ...SUBTEXT,
      description: 'The partner logos further down are edited under Home page > Partner logos.',
    },
    coordination: { label: 'Why us cards', description: 'The cards just after the partner logos.' },
    'coordination.title': { label: 'Title' },
    'coordination.subtext': SUBTEXT,
    'coordination.features': {
      label: 'Cards',
      description: 'Up to 6. The first three cards have fixed icons, in this order.',
    },
    'coordination.features.$': { label: 'Card' },
    'coordination.features.$.title': { label: 'Card title' },
    'coordination.features.$.description': { label: 'Card text' },
    steps: { label: 'Claim steps', description: 'The numbered timeline; numbers follow the order below.' },
    'steps.eyebrow': BADGE,
    'steps.title': { label: 'Title' },
    'steps.items': { label: 'Steps' },
    'steps.items.$': { label: 'Step' },
    'steps.items.$.label': { label: 'Step name' },
    'steps.items.$.description': { label: 'Step text' },
    cta: { label: 'Closing call to action', description: 'The red-accented band near the bottom of the page.' },
    'cta.line1': { label: 'Title', description: 'White.' },
    'cta.accent': { label: 'Title — red part', description: 'Red, after the white part.' },
    'cta.subtext': SUBTEXT,
    disclaimer: { label: 'Small print', description: 'The fine print at the very bottom of the page.' },
  },
  'page.about': {
    hero: {
      label: 'Top banner',
      description: 'The title reads as two lines: "line 1 + red word 1." then "line 2 + red word 2."',
    },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.accent1': { label: 'Title — line 1, red word', description: 'Red, right after line 1.' },
    'hero.line2': { label: 'Title — line 2', description: 'White.' },
    'hero.accent2': { label: 'Title — line 2, red word', description: 'Red, right after line 2.' },
    'hero.image': { label: 'Banner photo', description: 'Leave empty to use the built-in photo.' },
    heritage: { label: 'Our story', description: 'The section right under the banner.' },
    'heritage.title': { label: 'Title' },
    'heritage.text': { label: 'Story' },
    'heritage.stat1': {
      label: 'First number',
      description: 'A big figure with a short caption, e.g. "1998" / "Est.".',
    },
    'heritage.stat1.value': { label: 'Figure' },
    'heritage.stat1.label': { label: 'Caption' },
    'heritage.stat2': { label: 'Second number' },
    'heritage.stat2.value': { label: 'Figure' },
    'heritage.stat2.label': { label: 'Caption' },
    'heritage.image': { label: 'Story photo', description: 'Leave empty to use the built-in photo.' },
    'heritage.quote': { label: 'Quote', description: 'In the card overlapping the bottom of the photo.' },
    team: { label: 'Team' },
    'team.title': { label: 'Title' },
    'team.subtext': SUBTEXT,
    'team.members': { label: 'People' },
    'team.members.$': { label: 'Person' },
    'team.members.$.name': { label: 'Name' },
    'team.members.$.role': { label: 'Job title' },
    'team.members.$.image': { label: 'Photo', description: 'Leave empty to use the built-in photo.' },
    standards: { label: 'Our standards', description: 'The last section of the page.' },
    'standards.eyebrow': BADGE,
    'standards.title': {
      label: 'Title',
      widget: 'textarea',
      description: 'A line break is shown as a space; the last word is red.',
    },
    'standards.image': { label: 'Photo', description: 'Leave empty to use the built-in photo.' },
    'standards.items': { label: 'Standards' },
    'standards.items.$': { label: 'Standard' },
    'standards.items.$.title': { label: 'Title' },
    'standards.items.$.description': { label: 'Text' },
  },
  'page.process': {
    eyebrow: BADGE,
    title: {
      label: 'Title',
      description: 'The last two words are red. "{count}" becomes the number of switched-on steps.',
    },
    subtext: SUBTEXT,
  },
  ...MARKETING_FIELD_UI,
  ...SEO_PAGE_FIELD_UI,
};
