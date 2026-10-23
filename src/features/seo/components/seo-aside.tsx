'use client';

import { useQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import { fetchGlobal } from '@/features/globals/services/api';
import { globalKeys } from '@/features/globals/utils/query-keys';
import { useMediaByIds } from '@/features/media/hooks/use-media';
import type { GlobalValue } from '@/lib/content/globals';
import type { SeoPageKey } from '@/lib/content/globals-seo';
import { blank, pageDescription } from '@/lib/seo/metadata';
import { PUBLIC_PAGES, type PublicPageId } from '@/lib/seo/public-pages';
import { documentTitle } from '@/lib/seo/title';

import { SeoChecklist } from './seo-checklist';
import { SerpPreview, serpUrl } from './serp-preview';
import { SocialCard } from './social-card';

// Defaults come from the `seo` global and the public site settings; a failed read settles as
// "unknown" and falls back to the page's own label and registry text.
function useDefaults() {
  const seo = useQuery({
    queryKey: globalKeys.detail('seo'),
    queryFn: () => fetchGlobal('seo'),
    retry: false,
  });
  // The public site settings answer for every role, unlike the `site` global (settings.read).
  const site = useQuery({ queryKey: ['seo', 'site-meta'], queryFn: fetchSiteMeta, retry: false });
  const raw = seo.data?.value as GlobalValue<'seo'> | undefined;
  return {
    seo: raw,
    siteName: site.data?.businessName ?? '',
    settled: !seo.isPending && !site.isPending,
  };
}

type SiteMeta = { businessName: string };

async function fetchSiteMeta(): Promise<SiteMeta> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}/site-settings`);
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) throw new Error('Site name unavailable');
  const d = body.data ?? {};
  return {
    businessName: String(d.businessName ?? ''),
  };
}

type Ref = { kind: string; id?: string } | null | undefined;

// The live side of the SEO tab: what a search result and a shared link will look like for the
// values being typed.
export function SeoAside({ id, values }: { id: PublicPageId; values: GlobalValue<SeoPageKey> | undefined }) {
  const { seo, siteName, settled } = useDefaults();
  const page = PUBLIC_PAGES[id];
  // The page's own image wins; a legacy (non-media) image is never replaced by the default.
  const ref: Ref = values?.ogImage ?? seo?.defaultOgImage;
  const legacy = Boolean(ref) && ref?.kind !== 'media';
  const mediaId = ref?.kind === 'media' && ref.id ? ref.id : null;
  const media = useMediaByIds(mediaId ? [mediaId] : []);
  const image = mediaId ? media.data?.find((m) => m.id === mediaId) : undefined;
  const host = typeof window === 'undefined' ? '' : window.location.host.split(':')[0]!;

  const template = seo?.titleTemplate ?? '';
  const seoTitle = blank(values?.title) ?? null;
  // Without the site name the template cannot be applied, so show the bare title.
  const title =
    siteName || template.includes('%s')
      ? documentTitle({ id, seoTitle }, { titleTemplate: template, siteName })
      : (seoTitle ?? page.title);
  const description =
    (values && seo && pageDescription({ id, seo: values, defaults: seo, siteName, ogImage: null })) ||
    blank(values?.description) ||
    page.description;
  const ogTitle = blank(values?.ogTitle) ?? title;
  const ogDescription = blank(values?.ogDescription) ?? description;

  let ogUnknown: string | undefined;
  if (legacy) ogUnknown = 'Legacy image — size not checked';
  else if (mediaId && !image) ogUnknown = media.isPending ? 'Checking share image' : 'Share image size unknown';
  else if (image && !(image.width && image.height)) ogUnknown = 'Share image size unknown';

  return (
    <aside className='flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start'>
      <DashboardCard title='In search results'>
        {settled ? (
          <SerpPreview url={serpUrl(host, page.path)} title={title} description={description} />
        ) : (
          <Skeleton className='h-24 w-full' />
        )}
      </DashboardCard>
      <DashboardCard title='When shared'>
        <SocialCard
          siteHost={host}
          title={ogTitle}
          description={ogDescription}
          imageSrc={image?.url}
          legacyImage={legacy}
          pageId={id}
        />
      </DashboardCard>
      <DashboardCard title='Checks'>
        {settled ? (
          <SeoChecklist
            ogUnknown={ogUnknown}
            input={{
              title,
              titleUnique: true,
              description,
              ogImage: image?.width && image.height ? { width: image.width, height: image.height } : null,
              imagesMissingAlt: 0,
              hasH1: page.hasH1,
              noindex: (values?.noindex ?? false) || seo?.robots === 'noindex',
              internalLinks: page.codeLinks,
            }}
          />
        ) : (
          <Skeleton className='h-24 w-full' />
        )}
      </DashboardCard>
    </aside>
  );
}
