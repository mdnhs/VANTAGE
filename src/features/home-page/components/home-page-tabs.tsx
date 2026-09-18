'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroForm } from './sections/hero-form';
import { PillarsPanel } from './sections/pillars-panel';
import { CatalogPanel } from './sections/catalog-panel';
import { ProcessPanel } from './sections/process-panel';
import { TestimonialsPanel } from './sections/testimonials-panel';
import { PartnerLogosPanel } from './sections/partner-logos-panel';
import type { SiteSettings } from '@/features/site-settings/types';
import type { HomepagePillar } from '@/features/homepage-pillars/types';
import type { HomepageProcessStep } from '@/features/homepage-process-steps/types';
import type { Testimonial } from '@/features/testimonials/types';
import type { PartnerLogo } from '@/features/partner-logos/types';
import type { HomepageCatalog } from '@/features/homepage-catalogs/types';

const SECTIONS = [
  { value: 'hero', label: 'Hero' },
  { value: 'pillars', label: 'Pillars' },
  { value: 'catalog', label: 'Catalog' },
  { value: 'process', label: 'Process' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'partner-logos', label: 'Partner logos' },
] as const;

const SECTION_VALUES = SECTIONS.map((section) => section.value);

interface HomePageTabsProps {
  settings: SiteSettings | null;
  pillars: { data: HomepagePillar[]; total: number };
  catalogItems: { data: HomepageCatalog[]; total: number };
  processSteps: { data: HomepageProcessStep[]; total: number };
  testimonials: { data: Testimonial[]; total: number };
  partnerLogos: { data: PartnerLogo[]; total: number };
}

// One tab per homepage content type — hero copy lives on the site_settings singleton (same
// PATCH route as Settings); pillars/catalog/process steps/testimonials/partner logos are each their
// own CRUD tables. Tab is kept in the URL (?tab=...) via nuqs, same pattern as the Settings tabs.
export function HomePageTabs({
  settings,
  pillars,
  catalogItems,
  processSteps,
  testimonials,
  partnerLogos,
}: HomePageTabsProps) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(SECTION_VALUES).withDefault('hero').withOptions({ clearOnDefault: true }),
  );

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as (typeof SECTION_VALUES)[number])} className='gap-6'>
      {/* Horizontal here: the outer "Website pages" menu already owns the left column. */}
      <div className='overflow-x-auto border-b border-border'>
        <TabsList variant='line' className='h-auto w-max justify-start'>
          {SECTIONS.map((section) => (
            <TabsTrigger key={section.value} value={section.value}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className='min-w-0'>
        <TabsContent value='hero'>
          <HeroForm initialData={settings} />
        </TabsContent>
        <TabsContent value='pillars'>
          <PillarsPanel initialData={pillars} />
        </TabsContent>
        <TabsContent value='catalog'>
          <CatalogPanel settings={settings} catalogItems={catalogItems} />
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
      </div>
    </Tabs>
  );
}
