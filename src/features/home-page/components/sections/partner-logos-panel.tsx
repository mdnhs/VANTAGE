import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { PartnerLogoTable } from '@/features/partner-logos/components/list/partner-logo-table';
import type { PartnerLogo } from '@/features/partner-logos/types';

export function PartnerLogosPanel({ initialData }: { initialData: { data: PartnerLogo[]; total: number } }) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          Insurance and partner company logos shown on the homepage and insurance page, in display order.
        </p>
        <Link href={APP_ROUTES.content.partnerLogos.create} className={cn(buttonVariants())}>
          Add logo
        </Link>
      </div>
      <PartnerLogoTable initialData={initialData} />
    </div>
  );
}
