import { z } from 'zod';

// lowercase-kebab: letters/digits, hyphen-separated, no leading/trailing/double hyphens.
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 140;

// Links an editor may write: web, mail, phone, or a same-site path (never "//host" or "/\host").
export function isSafeHref(href: string): boolean {
  if (/^https?:\/\/[^\s/]/i.test(href)) return true;
  if (/^(?:mailto|tel):\S+$/i.test(href)) return true;
  return href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\') && !/[\s\\]/.test(href);
}

export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/, '');
}

// The editor's document, limited to the formatting the public renderer supports. Anything else
// (images, raw HTML, code blocks, unsafe links) is refused at write time.
const markSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('underline') }),
  z.object({
    type: z.literal('link'),
    attrs: z.looseObject({ href: z.string().max(2048).refine(isSafeHref, 'Unsupported link') }),
  }),
]);

const textNode = z.object({ type: z.literal('text'), text: z.string(), marks: z.array(markSchema).optional() });

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: z.infer<typeof markSchema>[];
};

const nodeSchema: z.ZodType<TiptapNode> = z.lazy(() => {
  const children = z.array(nodeSchema).optional();
  return z.union([
    textNode,
    z.object({
      type: z.literal('heading'),
      attrs: z.object({ level: z.union([z.literal(2), z.literal(3), z.literal(4)]) }),
      content: children,
    }),
    z.object({
      type: z.enum(['paragraph', 'bulletList', 'orderedList', 'listItem', 'blockquote']),
      attrs: z.record(z.string(), z.unknown()).optional(),
      content: children,
    }),
    z.object({ type: z.enum(['horizontalRule', 'hardBreak']) }),
  ]);
});

export const tiptapDocSchema = z.object({ type: z.literal('doc'), content: z.array(nodeSchema) });

export type TiptapDoc = z.infer<typeof tiptapDocSchema>;

export const createLegalPageSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().min(1).max(SLUG_MAX).regex(slugPattern, 'Must be lowercase kebab-case (e.g. privacy-policy)'),
  content: tiptapDocSchema,
  status: z.enum(['draft', 'published']).optional(),
});

export const updateLegalPageSchema = createLegalPageSchema.partial();

export const legalPageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const reorderLegalPagesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateLegalPageInput = z.infer<typeof createLegalPageSchema>;
export type UpdateLegalPageInput = z.infer<typeof updateLegalPageSchema>;
export type LegalPageListQuery = z.infer<typeof legalPageListQuerySchema>;
export type ReorderLegalPagesInput = z.infer<typeof reorderLegalPagesSchema>;
