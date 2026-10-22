'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { HomepageCatalogTable } from '@/features/homepage-catalogs/components/list/homepage-catalog-table';
import type { HomepageCatalog } from '@/features/homepage-catalogs/types';

interface CatalogPanelProps {
  catalogItems: { data: HomepageCatalog[]; total: number };
}

// The catalog header copy (eyebrow, headline, subtext) is part of the "Page copy" tab
// (`page.home`); this tab only manages the catalog items.
export function CatalogPanel({ catalogItems }: CatalogPanelProps) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-base font-semibold'>Catalog items</h2>
          <p className='text-sm text-muted-foreground'>
            The services shown in the homepage catalog grid, in display order. The header copy above the grid is under
            Page copy.
          </p>
        </div>
        <Link href={APP_ROUTES.content.homepageCatalogs.create} className={cn(buttonVariants())}>
          Add catalog item
        </Link>
      </div>

      <HomepageCatalogTable initialData={catalogItems} />
    </div>
  );
}
