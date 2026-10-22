import type { FieldOverrides } from '@/components/admin/schema-form/to-fields';
import type { EditableGlobalKey } from '@/lib/content/global-access';

// Admin labels and hints per global, as SchemaForm overrides keyed by dotted
// path ("links.$.label" is a list item's field). Plain data on purpose: the
// shared image/video ref schemas must not be re-registered, so labels for them
// live here. Keys not listed fall back to a humanised field name.
export const GLOBAL_FIELD_UI: Partial<Record<EditableGlobalKey, FieldOverrides>> = {
  site: {
    name: { label: 'Business name' },
    legalName: { label: 'Legal name', description: 'Shown in the footer and legal pages when set.' },
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
    'phone.e164': { label: 'Phone for links (E.164)', placeholder: '+35312345678' },
    emergencyPhone: { label: 'Emergency phone', inputType: 'tel' },
    whatsapp: { label: 'WhatsApp number', inputType: 'tel' },
    'address.lines': { label: 'Address lines' },
    'address.eircode': { label: 'Eircode' },
    hours: { label: 'Opening hours' },
    'hours.weekly': { widget: 'weekly-hours-groups', label: 'Opening times' },
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
    titleTemplate: { label: 'Title template', description: '"%s" is replaced by the page title.' },
    defaultOgImage: { label: 'Default share image' },
    twitterHandle: { label: 'X / Twitter handle' },
  },
  privacy: {
    enquiryRetentionMonths: {
      label: 'Keep enquiries for (months)',
      description:
        'Only finished enquiries are deleted, counted from their last update: completed, cancelled or archived quotes with no invoice or payment, and replied or archived contact messages. New and in-progress enquiries are never deleted.',
    },
    spamRetentionDays: {
      label: 'Keep spam for (days)',
      description: 'Applies to enquiries marked as spam (none until spam marking ships).',
    },
  },
};
