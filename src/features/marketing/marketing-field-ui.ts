import type { FieldOverrides } from '@/components/admin/schema-form/to-fields';

// Admin labels and hints for the marketing globals; spread into GLOBAL_FIELD_UI.
export const MARKETING_FIELD_UI = {
  consent: {
    enabled: {
      label: 'Show the consent banner',
      section: 'Banner',
      sectionDescription: 'What visitors see first, at the bottom of every page.',
    },
    title: { label: 'Title', section: 'Banner' },
    body: { label: 'Text', widget: 'textarea', section: 'Banner' },
    accept: { label: 'Accept button', section: 'Buttons', sectionDescription: 'The wording of the four choices.' },
    reject: { label: 'Reject button', section: 'Buttons' },
    customise: { label: 'Customise button', section: 'Buttons' },
    save: { label: 'Save choices button', section: 'Buttons' },
    settingsLink: {
      label: 'Footer link text',
      description: 'Lets visitors change their choice later.',
      section: 'Links',
      sectionDescription: 'The footer link and the privacy policy link in the banner.',
    },
    policyLabel: { label: 'Privacy policy link text', section: 'Links' },
    policyHref: { label: 'Privacy policy link', section: 'Links' },
    categories: { label: 'Category descriptions' },
    'categories.necessary': { label: 'Necessary' },
    'categories.analytics': { label: 'Analytics' },
    'categories.marketing': { label: 'Marketing' },
    reconsentMonths: {
      label: 'Ask again after (months)',
      section: 'Asking again',
      sectionDescription: 'When a visitor is asked to choose again.',
    },
    version: { label: 'Version', description: 'Raising it asks every visitor again.', section: 'Asking again' },
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
