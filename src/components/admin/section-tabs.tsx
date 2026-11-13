'use client';

import { useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger, useInsideTabs } from '@/components/ui/tabs';

export type SectionTab = {
  value: string;
  label: string;
  // A line of help shown at the top of the tab.
  description?: string;
  // Marks the tab with a red dot (a field on it failed validation).
  invalid?: boolean;
  content: ReactNode;
};

// The one horizontal tab style for every settings screen: an underlined row of tabs with the
// panel below. By default every panel stays mounted (hidden), so fields on a tab that is not
// showing still validate and submit; pass `keepMounted={false}` for panels that are separate
// screens of their own. Controlled with `value`, or left to manage itself.
export function SectionTabs({
  tabs,
  value,
  onValueChange,
  keepMounted = true,
  action,
  className,
}: {
  tabs: SectionTab[];
  value?: string;
  onValueChange?: (value: string) => void;
  keepMounted?: boolean;
  // A small control at the right end of the tab row (e.g. History), so it needs no row of its own.
  action?: ReactNode;
  className?: string;
}) {
  const [own, setOwn] = useState(tabs[0]?.value ?? '');
  const active = value ?? own;
  // Inside another tab panel: a box row with no underline (see useInsideTabs).
  const nested = useInsideTabs();
  return (
    <Tabs
      value={active}
      onValueChange={(next) => {
        setOwn(String(next));
        onValueChange?.(String(next));
      }}
      className={className ?? 'gap-5'}
    >
      <div className={cn('flex flex-wrap items-end justify-between gap-3', !nested && 'border-b border-border')}>
        <TabsList variant='line' className='h-auto w-fit max-w-full flex-wrap justify-start'>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {tab.invalid ? (
                <span role='img' aria-label='has errors' className='size-1.5 rounded-full bg-destructive' />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
        {action ? <div className={cn('shrink-0', !nested && 'pb-2')}>{action}</div> : null}
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} keepMounted={keepMounted} className='flex flex-col gap-5'>
          {tab.description ? <p className='text-sm text-muted-foreground'>{tab.description}</p> : null}
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
