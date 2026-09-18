import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { HomepageProcessStepTable } from '@/features/homepage-process-steps/components/list/homepage-process-step-table';
import type { HomepageProcessStep } from '@/features/homepage-process-steps/types';

export function ProcessPanel({ initialData }: { initialData: { data: HomepageProcessStep[]; total: number } }) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          The numbered process-step cards shown on the homepage, in display order.
        </p>
        <Link href={APP_ROUTES.content.homepageProcessSteps.create} className={cn(buttonVariants())}>
          Add step
        </Link>
      </div>
      <HomepageProcessStepTable initialData={initialData} />
    </div>
  );
}
