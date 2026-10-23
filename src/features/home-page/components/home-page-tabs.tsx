'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCan } from '@/contexts/actor-provider';
import { GlobalEditor } from '@/features/globals/components/global-editor';
import { PageSeoTab } from '@/features/seo/components/page-seo-tab';
import { PillarsPanel } from './sections/pillars-panel';
import { CatalogPanel } from './sections/catalog-panel';
import { ProcessPanel } from './sections/process-panel';
import { TestimonialsPanel } from './sections/testimonials-panel';
import { PartnerLogosPanel } from './sections/partner-logos-panel';
import type { HomepagePillar } from '@/features/homepage-pillars/types';
import type { HomepageProcessStep } from '@/features/homepage-process-steps/types';
import type { Testimonial } from '@/features/testimonials/types';
import type { PartnerLogo } from '@/features/partner-logos/types';
import type { HomepageCatalog } from '@/features/homepage-catalogs/types';

const SECTIONS = [
  { value: 'copy', label: 'Page copy' },
  { value: 'pillars', label: 'Pillars' },
  { value: 'catalog', label: 'Catalog' },
  { value: 'process', label: 'Process' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'partner-logos', label: 'Partner logos' },
  { value: 'seo', label: 'SEO' },
] as const;

export interface HomePageTabsProps {
  pillars: { data: HomepagePillar[]; total: number };
  catalogItems: { data: HomepageCatalog[]; total: number };
  processSteps: { data: HomepageProcessStep[]; total: number };
  testimonials: { data: Testimonial[]; total: number };
  partnerLogos: { data: PartnerLogo[]; total: number };
}

// One tab per homepage content type. "Page copy" (hero, trust badges, catalog header) is the
// versioned `page.home` global edited with GlobalEditor; pillars/catalog items/process steps/
// testimonials/partner logos are each their own CRUD tables. Tab is kept in the URL (?tab=...)
// via nuqs.
export function HomePageTabs({ pillars, catalogItems, processSteps, testimonials, partnerLogos }: HomePageTabsProps) {
  const canSeo = useCan({ seo: ['read'] });
  const sections = SECTIONS.filter((section) => section.value !== 'seo' || canSeo);
  const values = sections.map((section) => section.value);
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(values).withDefault('copy').withOptions({ clearOnDefault: true }),
  );

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as (typeof values)[number])} className='gap-6'>
      {/* Horizontal here: the outer "Website pages" menu already owns the left column. */}
      <div className='border-b border-border'>
        <TabsList variant='line' className='h-auto w-fit max-w-full flex-wrap justify-start'>
          {sections.map((section) => (
            <TabsTrigger key={section.value} value={section.value}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className='min-w-0'>
        <TabsContent value='copy'>
          <GlobalEditor title='Home page' keys={['page.home']} embedded />
        </TabsContent>
        <TabsContent value='pillars'>
          <PillarsPanel initialData={pillars} />
        </TabsContent>
        <TabsContent value='catalog'>
          <CatalogPanel catalogItems={catalogItems} />
        </TabsContent>
        <TabsContent value='process'>
          <ProcessPanel initialData={processSteps} />
        </TabsContent>
        <TabsContent value='testimonials'>
          <TestimonialsPanel initialData={testimonials} />
        </TabsContent>
        <TabsContent value='partner-logos'>
          <PartnerLogosPanel initialData={partnerLogos} />
        </TabsContent>
        {canSeo ? (
          <TabsContent value='seo'>
            <PageSeoTab id='home' />
          </TabsContent>
        ) : null}
      </div>
    </Tabs>
  );
}
