'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'motion/react';
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// How many <Tabs> wrap this point. A tab row inside another tab's panel is drawn as a box
// (segmented) row rather than a second underlined row, so the two levels never look alike.
const TabsDepth = createContext(0);

// True inside another tab panel: call it before rendering your own <Tabs>.
export function useInsideTabs() {
  return useContext(TabsDepth) > 0;
}

function Tabs({ className, orientation = 'horizontal', ...props }: TabsPrimitive.Root.Props) {
  const depth = useContext(TabsDepth);
  return (
    <TabsDepth.Provider value={depth + 1}>
      <TabsPrimitive.Root
        data-slot='tabs'
        data-orientation={orientation}
        className={cn('group/tabs flex gap-2 data-horizontal:flex-col', className)}
        {...props}
      />
    </TabsDepth.Provider>
  );
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type Box = { x: number; y: number; w: number; h: number };

// The active tab's box inside the list, kept current as the active tab, its label or the list's
// size change. Null until measured (and when no tab is active).
function useActiveTabBox(list: React.RefObject<HTMLDivElement | null>) {
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const tab = el.querySelector<HTMLElement>(':scope > [data-slot="tabs-trigger"][data-active]');
      setBox(tab ? { x: tab.offsetLeft, y: tab.offsetTop, w: tab.offsetWidth, h: tab.offsetHeight } : null);
    };
    measure();
    const attributes = new MutationObserver(measure);
    attributes.observe(el, { subtree: true, attributes: true, attributeFilter: ['data-active'] });
    const size = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    size?.observe(el);
    return () => {
      attributes.disconnect();
      size?.disconnect();
    };
  }, [list]);
  return box;
}

function TabsList({
  className,
  variant = 'default',
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  // A nested underlined row becomes a box row (see TabsDepth).
  const depth = useContext(TabsDepth);
  const shown = variant === 'line' && depth > 1 ? 'default' : variant;
  const ref = useRef<HTMLDivElement>(null);
  const box = useActiveTabBox(ref);
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot='tabs-list'
      data-variant={shown}
      // Once measured, one indicator slides between tabs and the tabs' own active styles step aside.
      data-indicator={box ? 'ready' : undefined}
      className={cn(tabsListVariants({ variant: shown }), 'relative', shown !== variant && 'h-auto', className)}
      {...props}
    >
      {box ? (
        <motion.span
          aria-hidden
          data-slot='tabs-indicator'
          initial={false}
          animate={
            shown === 'line'
              ? { x: box.x, y: box.y + box.h + 3, width: box.w, height: 2 }
              : { x: box.x, y: box.y, width: box.w, height: box.h }
          }
          transition={{ type: 'spring', stiffness: 520, damping: 42 }}
          className={cn(
            'pointer-events-none absolute top-0 left-0',
            shown === 'line'
              ? 'rounded-full bg-foreground'
              : 'rounded-md bg-background shadow-sm dark:border dark:border-input dark:bg-input/30',
          )}
        />
      ) : null}
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot='tabs-trigger'
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
        'data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground',
        'z-[1] group-data-[indicator=ready]/tabs-list:after:hidden group-data-[indicator=ready]/tabs-list:data-active:border-transparent! group-data-[indicator=ready]/tabs-list:data-active:bg-transparent! group-data-[indicator=ready]/tabs-list:data-active:shadow-none!',
        'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel data-slot='tabs-content' className={cn('flex-1 text-sm outline-none', className)} {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
