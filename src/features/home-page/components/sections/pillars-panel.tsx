import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { HomepagePillarTable } from '@/features/homepage-pillars/components/list/homepage-pillar-table';
import type { HomepagePillar } from '@/features/homepage-pillars/types';

export function PillarsPanel({ initialData }: { initialData: { data: HomepagePillar[]; total: number } }) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          The 4 feature-pillar cards shown on the homepage, in display order.
        </p>
        <Link href={APP_ROUTES.content.homepagePillars.create} className={cn(buttonVariants())}>
          Add pillar
        </Link>
      </div>
      <HomepagePillarTable initialData={initialData} />
    </div>
  );
}
