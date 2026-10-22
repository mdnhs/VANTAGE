'use client';

import { useState } from 'react';

import { GlobalEditor } from '@/features/globals/components/global-editor';
import { useGlobal } from '@/features/globals/hooks/api/query/use-global';
import type { GlobalValue } from '@/lib/content/globals';
import { seoPageKey, type SeoPageKey } from '@/lib/content/globals-seo';
import { PUBLIC_PAGES, type PublicPageId } from '@/lib/seo/public-pages';

import { SeoAside } from './seo-aside';

// A public page's SEO: the `seo.page.<id>` form beside a live search result, share card and
// checklist. Read-only without seo.update and under View-as (GlobalForm decides).
export function PageSeoTab({ id }: { id: PublicPageId }) {
  const key = seoPageKey(id);
  const stored = useGlobal(key);
  const [live, setLive] = useState<GlobalValue<SeoPageKey> | undefined>();
  const values = live ?? (stored.data?.value as GlobalValue<SeoPageKey> | undefined);
  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]'>
      <GlobalEditor
        title={`${PUBLIC_PAGES[id].label} SEO`}
        keys={[key]}
        embedded
        onValuesChange={(next) => setLive(next as GlobalValue<SeoPageKey>)}
      />
      <SeoAside id={id} values={values} />
    </div>
  );
}
