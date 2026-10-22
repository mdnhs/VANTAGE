import type { FieldOverrides } from '@/components/admin/schema-form/to-fields';
import { SEO_PAGE_KEYS, TWITTER_CARDS, type SeoPageKey } from '@/lib/content/globals-seo';

// Admin labels for a page's SEO form (MK wording); spread into GLOBAL_FIELD_UI.
const PAGE_SEO_UI = {
  title: { label: 'SEO title' },
  description: { label: 'Meta description', widget: 'textarea' },
  ogTitle: { label: 'Social title' },
  ogDescription: { label: 'Social description', widget: 'textarea' },
  ogImage: { label: 'Social share image' },
  canonical: { label: 'Canonical address', description: "Leave empty to use this page's own address." },
  twitterCard: {
    label: 'Card type',
    widget: 'select',
    options: TWITTER_CARDS.map((value) => ({
      value,
      label: value === 'summary_large_image' ? 'Large image' : 'Small image',
    })),
  },
  noindex: { label: 'Hide from search engines' },
} as const satisfies FieldOverrides;

export const SEO_PAGE_FIELD_UI = Object.fromEntries(
  SEO_PAGE_KEYS.map((key) => [key, PAGE_SEO_UI]),
) as unknown as Record<SeoPageKey, FieldOverrides>;
