import type { ReactNode } from 'react';
import Image from 'next/image';
import { Suspense } from 'react';
import { AuthBrand } from '@/features/auth/components/auth-brand';
import { siteSettingsService } from '@/server/services/site-settings-service';

// Split layout: brand panel left, form panel right. Below 1024px only the form panel shows.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className='grid min-h-svh gap-4 bg-background p-3 sm:p-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]'>
      <section
        aria-hidden
        className='relative isolate hidden flex-col justify-between overflow-hidden rounded-[28px] bg-neutral-950 p-10 text-white lg:flex xl:p-12'
      >
        <Image
          src='/assets/marketing/stitch-hero.jpg'
          alt=''
          fill
          priority
          sizes='50vw'
          className='-z-10 object-cover opacity-40'
        />
        <div className='absolute inset-0 -z-10 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30' />
        <Suspense fallback={<div className='h-10' />}>
          <Brand />
        </Suspense>
        <div className='flex max-w-lg flex-col gap-5'>
          <span className='h-1 w-12 rounded-full bg-red-600' />
          <p className='text-[2.5rem] leading-[1.1] font-semibold tracking-tight text-balance'>
            Run your website from one place.
          </p>
          <p className='text-[15px] leading-relaxed text-white/75'>
            Update pages, services and projects, and follow up quote requests and customer messages as they come in.
          </p>
        </div>
      </section>
      <section className='flex flex-col rounded-[28px] bg-sidebar px-6 py-8 sm:px-10 lg:px-12'>
        <div className='lg:hidden'>
          <Suspense fallback={<div className='h-10' />}>
            <Brand />
          </Suspense>
        </div>
        <div className='flex flex-1 items-center justify-center py-12'>
          <div className='w-full max-w-[400px]'>{children}</div>
        </div>
        <p className='text-center text-xs text-muted-foreground'>
          Access is by invitation only. Ask an owner if you need an account.
        </p>
      </section>
    </main>
  );
}

async function Brand() {
  const settings = await siteSettingsService.getPublic();
  return (
    <AuthBrand
      businessName={settings.businessName}
      logo={settings.logo}
      logoLottieJson={'logoLottieJson' in settings ? settings.logoLottieJson : null}
      logoUseLottie={'logoUseLottie' in settings ? Boolean(settings.logoUseLottie) : false}
    />
  );
}
