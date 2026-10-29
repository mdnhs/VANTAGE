import { z } from 'zod';

import { Canonical } from '@/lib/content/globals-seo';

// Optional page text; blank or null falls back on the public page.
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

// The search and sharing fields of a page served from a content row (service, project,
// legal page): the same set as a public page's SEO tab. Every field is optional.
export const seoFieldsSchema = z.object({
  seoTitle: optionalText(70),
  seoDescription: optionalText(200),
  ogTitle: optionalText(70),
  ogDescription: optionalText(200),
  ogImageMediaId: z.string().uuid().nullable().optional(),
  canonical: Canonical.nullable().optional(),
  noindex: z.boolean().optional(),
});

export type SeoFieldsInput = z.infer<typeof seoFieldsSchema>;
