'use client';

import { useQuery } from '@tanstack/react-query';

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

// Defaults come from the `seo` and `site` globals; a role that cannot read them falls back to
// the page's own label and registry text.
function useDefaults<K extends 'seo' | 'site'>(key: K) {
  return useQuery({ queryKey: globalKeys.detail(key), queryFn: () => fetchGlobal(key), retry: false }).data?.value as
    | GlobalValue<K>
    | undefined;
}

const mediaId = (ref: { kind: string; id?: string } | null | undefined) =>
  ref?.kind === 'media' && ref.id ? ref.id : null;

// The live side of the SEO tab: what a search result and a shared link will look like for the
// values being typed.
export function SeoAside({ id, values }: { id: PublicPageId; values: GlobalValue<SeoPageKey> | undefined }) {
  const seo = useDefaults('seo');
  const site = useDefaults('site');
  const page = PUBLIC_PAGES[id];
  const ownId = mediaId(values?.ogImage);
  const defaultId = mediaId(seo?.defaultOgImage);
  const media = useMediaByIds([ownId, defaultId].filter((v): v is string => Boolean(v)));
  const image = media.data?.find((m) => m.id === (ownId ?? defaultId));
  const host = typeof window === 'undefined' ? '' : window.location.host.split(':')[0]!;

  const siteName = site?.name ?? '';
  const template = seo?.titleTemplate ?? '';
  const seoTitle = blank(values?.title) ?? null;
  // Without the site name (no read access) the template cannot be applied, so show the bare title.
  const title =
    siteName || template.includes('%s')
      ? documentTitle({ id, seoTitle }, { titleTemplate: template, siteName })
      : (seoTitle ?? page.title);
  const description =
    (values &&
      seo &&
      pageDescription({ id, seo: values, defaults: seo, siteName, ogImage: null })) ||
    blank(values?.description) ||
    page.description;
  const ogTitle = blank(values?.ogTitle) ?? title;
  const ogDescription = blank(values?.ogDescription) ?? description;

  return (
    <aside className='flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start'>
      <DashboardCard title='In search results'>
        <SerpPreview url={serpUrl(host, page.path)} title={title} description={description} />
      </DashboardCard>
      <DashboardCard title='When shared'>
        <SocialCard
          siteHost={host}
          siteName={siteName || page.label}
          title={ogTitle}
          description={ogDescription}
          imageSrc={image?.url}
        />
      </DashboardCard>
      <DashboardCard title='Checks'>
        <SeoChecklist
          input={{
            title,
            titleUnique: true,
            description,
            ogImage: image?.width && image.height ? { width: image.width, height: image.height } : null,
            imagesMissingAlt: 0,
            hasH1: page.hasH1,
            noindex: values?.noindex ?? false,
            internalLinks: page.codeLinks,
          }}
        />
      </DashboardCard>
    </aside>
  );
}
