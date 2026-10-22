import { isPublicPageId, PUBLIC_PAGE_IDS } from '@/lib/seo/public-pages';
import { ogColors, ogSubjectFor, renderOg } from '@/server/lib/seo/og';

// One prerendered card per public page. `dynamicParams` is not allowed with cacheComponents, so any
// other id reaches GET and answers 404 there.
export const generateStaticParams = () => PUBLIC_PAGE_IDS.map((page) => ({ page }));

export async function GET(_request: Request, ctx: RouteContext<'/og/[page]'>) {
  const { page } = await ctx.params;
  if (!isPublicPageId(page)) return new Response('Not found', { status: 404 });
  return renderOg(await ogSubjectFor(page), await ogColors());
}
