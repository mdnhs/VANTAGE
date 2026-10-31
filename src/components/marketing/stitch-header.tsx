'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';
import { LottieLogo } from '@/components/ui/lottie-logo';
import { telHref } from '@/lib/content/phone';
import type { GlobalValue } from '@/lib/content/globals';

const ICON_PHONE = '/assets/landing/0943df176868fa54f9c4d56f120f2cb266e6fd3b.svg';
const ICON_ARROW = '/assets/landing/2065fb2a6a3ee56f9cd715ecf7f319a2a65ffe90.svg';
const FALLBACK_LOGO = '/assets/landing/27e96966dcba4218e85dc86d5723b210f88c7f2d.png';

interface StitchHeaderProps {
  // Editable in Settings > Navigation; the defaults are the original links and button copy.
  navigation: GlobalValue<'navigation'>;
  phone: string;
  phoneHref?: string;
  businessName: string;
  logo: PublicImage | null;
  logoLottieJson?: string | null;
  logoUseLottie?: boolean;
}

function PhoneIcon() {
  return (
    <span className='relative block size-[18px] shrink-0 overflow-clip'>
      <span className='absolute inset-[12.5%]'>
        <span className='absolute inset-[-4.17%]'>
          <Image
            src={ICON_PHONE}
            alt=''
            width={14.6249}
            height={14.625}
            unoptimized
            className='block size-full max-w-none'
          />
        </span>
      </span>
    </span>
  );
}

function ArrowIcon() {
  return (
    <span className='relative block size-[16px] shrink-0 overflow-clip'>
      <span className='absolute top-1/4 right-[37.5%] bottom-1/4 left-[37.5%]'>
        <span className='absolute inset-[-6.25%_-12.5%]'>
          <Image
            src={ICON_ARROW}
            alt=''
            width={5.00003}
            height={9.00007}
            unoptimized
            className='block size-full max-w-none'
          />
        </span>
      </span>
    </span>
  );
}

export function StitchHeader({
  navigation,
  phone,
  phoneHref: phoneHrefProp,
  businessName,
  logo,
  logoLottieJson,
  logoUseLottie = false,
}: StitchHeaderProps) {
  // Figma 131:4: the desktop bar skips `mobileOnly` links, the mobile menu lists all of them.
  const desktopLinks = navigation.links.filter((link) => link.label && link.href && !link.mobileOnly);
  const mobileLinks = navigation.links.filter((link) => link.label && link.href);
  const { cta } = navigation;
  const phoneHref = phoneHrefProp ?? telHref(phone);
  const logoSrc = logo ? sizedSrc(logo, 'h_240') : FALLBACK_LOGO;

  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoImage = (
    <Image
      src={logoSrc}
      alt={businessName}
      width={224}
      height={128}
      className='h-[48px] w-[84px] object-contain sm:h-[64px] sm:w-[112px]'
      priority
    />
  );

  return (
    // MAIN STICKY NAVIGATION
    <header className='sticky top-0 z-40 w-full border-b border-[#232328] bg-[#111113]'>
      <div className='mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-10 xl:px-0'>
        {/* Logo */}
        <Link
          href='/'
          aria-label={businessName}
          className='flex shrink-0 items-center rounded-[8px] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'
        >
          {logoUseLottie && logoLottieJson ? (
            <LottieLogo
              data={logoLottieJson}
              alt={businessName}
              className='h-[48px] w-[84px] sm:h-[64px] sm:w-[112px]'
              fallback={logoImage}
            />
          ) : (
            logoImage
          )}
        </Link>

        {/* Desktop Nav Links */}
        <nav className='hidden items-center gap-[36px] lg:flex'>
          {desktopLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`text-[14px] leading-[normal] font-medium whitespace-nowrap transition-colors focus-visible:text-white focus-visible:outline-none ${
                  active ? 'text-white' : 'text-[#a1a1a1] hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className='flex items-center gap-3 sm:gap-[32px]'>
          <a
            href={phoneHref}
            className='hidden items-center gap-[10px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none md:flex'
          >
            <PhoneIcon />
            <span>{phone}</span>
          </a>

          {cta.href && (
            <Link
              href={cta.href}
              className='hidden shrink-0 items-center gap-[6px] rounded-[8px] bg-brand py-[11px] pr-[16px] pl-[22px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:flex'
            >
              <span>{cta.label}</span>
              <ArrowIcon />
            </Link>
          )}

          {/* Mobile menu: right-side sheet with every link and both buttons */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              className='flex size-[42px] items-center justify-center rounded-[8px] border border-[#232328] text-[#a1a1a1] transition-colors hover:border-[#3a3a40] hover:text-white focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none lg:hidden'
              aria-label='Toggle navigation menu'
            >
              <Menu className='size-5' />
            </SheetTrigger>
            <SheetContent
              side='right'
              showCloseButton={false}
              className='w-[85%] gap-0 border-[#232328] bg-[#111113] p-0 text-white sm:max-w-sm lg:hidden'
            >
              <div className='flex items-center justify-between border-b border-[#232328] px-5 py-4'>
                <SheetTitle className='text-[11px] font-normal tracking-[0.88px] text-white uppercase'>Menu</SheetTitle>
                <SheetClose
                  className='flex size-[38px] items-center justify-center rounded-[8px] border border-[#232328] text-[#a1a1a1] transition-colors hover:border-[#3a3a40] hover:text-white focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'
                  aria-label='Close navigation menu'
                >
                  <X className='size-5' />
                </SheetClose>
              </div>
              <nav className='flex flex-col px-5'>
                {mobileLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={`${link.label}-${link.href}`}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between border-b border-[#232328] py-[14px] text-[15px] leading-[normal] font-medium transition-colors ${
                        active ? 'text-white' : 'text-[#a1a1a1] hover:text-white'
                      }`}
                    >
                      {link.label}
                      {active && <span className='size-[6px] rounded-full bg-brand' />}
                    </Link>
                  );
                })}
              </nav>
              <div className='mt-auto flex flex-col gap-3 px-5 pt-6 pb-8'>
                {cta.href && (
                  <Link
                    href={cta.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className='flex w-full items-center justify-center gap-[6px] rounded-[8px] bg-brand py-[13px] text-[14px] leading-[normal] font-semibold text-white transition-colors hover:bg-brand-hover'
                  >
                    <span>{cta.label}</span>
                    <ArrowIcon />
                  </Link>
                )}
                {cta.mobileHref && (
                  <Link
                    href={cta.mobileHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className='flex w-full items-center justify-center gap-[6px] rounded-[8px] border border-[#232328] bg-white/[0.03] py-[13px] text-[14px] leading-[normal] font-semibold text-white transition-colors hover:border-[#3a3a40]'
                  >
                    <span>{cta.mobileLabel}</span>
                    <ArrowIcon />
                  </Link>
                )}
                <a
                  href={phoneHref}
                  className='flex w-full items-center justify-center gap-[10px] rounded-[8px] border border-[#232328] bg-white/[0.03] py-[12px] text-[14px] leading-[normal] font-semibold text-white transition-colors hover:border-[#3a3a40]'
                >
                  <PhoneIcon />
                  <span>{phone}</span>
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
