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
    'lottieLogo.json': { label: 'Lottie JSON', description: 'Paste the exported animation JSON.' },
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
    'hours.weekly': { label: 'Opening times' },
    'hours.weekly.$.days': { label: 'Days (1 = Monday … 7 = Sunday)' },
    'hours.weekly.$.opens': { label: 'Opens', placeholder: '08:00' },
    'hours.weekly.$.closes': { label: 'Closes', placeholder: '18:00' },
    'hours.summary': { description: 'How the site prints the hours.' },
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
    'autoReply.enabled': { label: 'Send an auto-reply' },
    'autoReply.body': { description: 'The enquiry text is never added to the auto-reply.' },
  },
  privacy: {
    enquiryRetentionMonths: { label: 'Keep enquiries for (months)' },
    spamRetentionDays: { label: 'Keep spam for (days)' },
  },
};
