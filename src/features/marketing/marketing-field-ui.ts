import type { FieldOverrides } from '@/components/admin/schema-form/to-fields';

// Admin labels and hints for the marketing globals; spread into GLOBAL_FIELD_UI.
export const MARKETING_FIELD_UI = {
  consent: {
    enabled: { label: 'Show the consent banner' },
    title: { label: 'Title' },
    body: { label: 'Text', widget: 'textarea' },
    accept: { label: 'Accept button' },
    reject: { label: 'Reject button' },
    customise: { label: 'Customise button' },
    save: { label: 'Save choices button' },
    settingsLink: { label: 'Footer link text', description: 'Lets visitors change their choice later.' },
    policyLabel: { label: 'Privacy policy link text' },
    policyHref: { label: 'Privacy policy link' },
    categories: { label: 'Category descriptions' },
    'categories.necessary': { label: 'Necessary' },
    'categories.analytics': { label: 'Analytics' },
    'categories.marketing': { label: 'Marketing' },
    reconsentMonths: { label: 'Ask again after (months)' },
    version: { label: 'Version', description: 'Raising it asks every visitor again.' },
  },
  scripts: {
    snippets: { label: 'Snippets' },
    'snippets.$.name': { label: 'Name' },
    'snippets.$.placement': { label: 'Where it goes' },
    'snippets.$.src': { label: 'Script address', inputType: 'url', placeholder: 'https://' },
    'snippets.$.inline': { label: 'Inline code', widget: 'textarea' },
    'snippets.$.category': { label: 'Consent category' },
    'snippets.$.routes': {
      label: 'Pages',
      description: 'Blank runs everywhere. "/" is exact, "/services/*" is a prefix.',
    },
    'snippets.$.enabled': { label: 'Turned on' },
  },
} as const satisfies Record<string, FieldOverrides>;
