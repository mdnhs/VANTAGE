import type { FieldOverrides } from '@/components/admin/schema-form/to-fields';
import { SEO_PAGE_KEYS, TWITTER_CARDS, type SeoPageKey } from '@/lib/content/globals-seo';

// Admin labels for a page's SEO form (MK wording); spread into GLOBAL_FIELD_UI.
const PAGE_SEO_UI = {
  title: {
    label: 'SEO title',
    section: 'Search results',
    sectionDescription: 'The blue link and the text under it on Google.',
  },
  description: { label: 'Meta description', widget: 'textarea', section: 'Search results' },
  ogTitle: {
    label: 'Social title',
    section: 'Social sharing',
    sectionDescription: 'The card shown when the page is shared on social media or in chats.',
  },
  ogDescription: { label: 'Social description', widget: 'textarea', section: 'Social sharing' },
  ogImage: { label: 'Social share image', section: 'Social sharing' },
  canonical: {
    label: 'Canonical address',
    description: "Leave empty to use this page's own address.",
    section: 'Indexing',
    sectionDescription: 'Whether and where search engines list this page.',
  },
  twitterCard: {
    label: 'Card type',
    widget: 'select',
    options: TWITTER_CARDS.map((value) => ({
      value,
      label: value === 'summary_large_image' ? 'Large image' : 'Small image',
    })),
    section: 'Social sharing',
  },
  noindex: { label: 'Hide from search engines', section: 'Indexing' },
} as const satisfies FieldOverrides;

export const SEO_PAGE_FIELD_UI = Object.fromEntries(
  SEO_PAGE_KEYS.map((key) => [key, PAGE_SEO_UI]),
) as unknown as Record<SeoPageKey, FieldOverrides>;
