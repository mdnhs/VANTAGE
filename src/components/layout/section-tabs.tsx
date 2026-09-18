'use client';

import { useMemo, type ReactNode } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface SectionTab {
  value: string;
  label: string;
  content: ReactNode;
}

// Horizontal in-page tabs shared by every website-page editor (same look as the Home page
// tabs). Active tab lives in the URL (?tab=...) via nuqs; the first tab is the default.
export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const values = useMemo(() => tabs.map((tab) => tab.value), [tabs]);
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(values).withDefault(values[0]).withOptions({ clearOnDefault: true }),
  );

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value)} className='gap-6'>
      <div className='border-b border-border'>
        <TabsList variant='line' className='h-auto w-fit max-w-full flex-wrap justify-start'>
          {tabs.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className='min-w-0'>
        {tabs.map((item) => (
          <TabsContent key={item.value} value={item.value} className='flex flex-col gap-6'>
            {item.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
