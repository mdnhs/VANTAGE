'use client';

import { LayoutDashboardIcon } from 'lucide-react';
import Image from 'next/image';

import { LottieLogo } from '@/components/ui/lottie-logo';
import type { PublicImage } from '@/lib/media/public-image';
import { cn } from '@/lib/utils';

export type Brand = {
  name: string;
  logo: PublicImage | null;
  logoLottieJson: string | null;
  logoUseLottie: boolean;
};

// The site's logo (image, Lottie or a neutral glyph) with the business name,
// sized for admin chrome.
export function BrandMark({ brand, className }: { brand: Brand; className?: string }) {
  const image = brand.logo ? (
    <Image src={brand.logo.src} alt='' width={22} height={22} className='size-[22px] object-contain' />
  ) : (
    <LayoutDashboardIcon aria-hidden className='size-[18px] text-accent-foreground' />
  );
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span className='flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent'>
        {brand.logoUseLottie && brand.logoLottieJson ? (
          <LottieLogo data={brand.logoLottieJson} alt='' className='size-[22px] object-contain' fallback={image} />
        ) : (
          image
        )}
      </span>
      <span className='flex items-center gap-2'>
        <span className='max-w-36 truncate text-base font-semibold tracking-tight'>{brand.name}</span>
        <span className='rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold tracking-wide text-accent-foreground uppercase'>
          Admin
        </span>
      </span>
    </span>
  );
}
