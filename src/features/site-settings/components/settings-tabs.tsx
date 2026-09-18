'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessInfoForm } from './sections/business-info-form';
import { ContactForm } from './sections/contact-form';
import { SocialLinksForm } from './sections/social-links-form';
import { HeroMediaForm } from './sections/hero-media-form';
import { SeoForm } from './sections/seo-form';
import type { SiteSettings } from '../types';

const SECTIONS = [
  { value: 'business-info', label: 'Business info' },
  { value: 'contact', label: 'Contact' },
  { value: 'social-links', label: 'Social links' },
  { value: 'hero-media', label: 'Hero media' },
  { value: 'seo', label: 'SEO' },
] as const;

const SECTION_VALUES = SECTIONS.map((section) => section.value);

// Tab is kept in the URL (?tab=...) via nuqs — refreshing or sharing a link to a specific
// section lands on that section instead of always resetting to Business info.
export function SettingsTabs({ initialData }: { initialData: SiteSettings | null }) {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(SECTION_VALUES).withDefault('business-info').withOptions({ clearOnDefault: true }),
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as (typeof SECTION_VALUES)[number])}
      orientation='vertical'
      className='flex-row items-start gap-6'
    >
      <TabsList variant='line' className='w-48 shrink-0'>
        {SECTIONS.map((section) => (
          <TabsTrigger key={section.value} value={section.value}>
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className='min-w-0 flex-1'>
        <TabsContent value='business-info'>
          <BusinessInfoForm initialData={initialData} />
        </TabsContent>
        <TabsContent value='contact'>
          <ContactForm initialData={initialData} />
        </TabsContent>
        <TabsContent value='social-links'>
          <SocialLinksForm initialData={initialData} />
        </TabsContent>
        <TabsContent value='hero-media'>
          <HeroMediaForm initialData={initialData} />
        </TabsContent>
        <TabsContent value='seo'>
          <SeoForm initialData={initialData} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
