'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';
import { LottieLogo } from '@/components/ui/lottie-logo';
import type { GlobalValue } from '@/lib/content/globals';

const ICON_PHONE = '/assets/landing/0943df176868fa54f9c4d56f120f2cb266e6fd3b.svg';
const ICON_ARROW = '/assets/landing/2065fb2a6a3ee56f9cd715ecf7f319a2a65ffe90.svg';
const FALLBACK_LOGO = '/assets/landing/27e96966dcba4218e85dc86d5723b210f88c7f2d.png';

interface StitchHeaderProps {
  // Editable in Settings > Navigation; the defaults are the original links and button copy.
  navigation: GlobalValue<'navigation'>;
  phone: string;
  businessName: string;
  logoPublicId: string | null;
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
  businessName,
  logoPublicId,
  logoLottieJson,
  logoUseLottie = false,
}: StitchHeaderProps) {
  // Figma 131:4: the desktop bar skips `mobileOnly` links, the mobile menu lists all of them.
  const desktopLinks = navigation.links.filter((link) => link.label && link.href && !link.mobileOnly);
  const mobileLinks = navigation.links.filter((link) => link.label && link.href);
  const { cta } = navigation;
  const phoneHref = `tel:${phone.replace(/\s/g, '')}`;
  const logoSrc = logoPublicId ? cldUrl(logoPublicId, { height: 240 }) : FALLBACK_LOGO;

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
          className='flex shrink-0 items-center rounded-[8px] focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:outline-none'
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
            className='hidden items-center gap-[10px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white transition-colors hover:text-[#dc2626] focus-visible:text-[#dc2626] focus-visible:outline-none md:flex'
          >
            <PhoneIcon />
            <span>{phone}</span>
          </a>

          <Link
            href={cta.href}
            className='flex shrink-0 items-center gap-[6px] rounded-[8px] bg-[#dc2626] py-[11px] pr-[16px] pl-[22px] text-[14px] leading-[normal] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#b91c1c] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none max-sm:pr-[12px] max-sm:pl-[16px]'
          >
            <span>
              <span className='hidden sm:inline'>{cta.label}</span>
              <span className='sm:hidden'>{cta.shortLabel}</span>
            </span>
            <ArrowIcon />
          </Link>

          {/* Mobile Hamburger */}
          <button
            type='button'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='flex size-[42px] items-center justify-center rounded-[8px] border border-[#232328] text-[#a1a1a1] transition-colors hover:border-[#3a3a40] hover:text-white focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:outline-none lg:hidden'
            aria-label='Toggle navigation menu'
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className='size-5' /> : <Menu className='size-5' />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className='border-t border-[#232328] bg-[#111113] px-4 pt-3 pb-5 sm:px-6 lg:hidden'>
          <nav className='flex flex-col'>
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
                  {active && <span className='size-[6px] rounded-full bg-[#dc2626]' />}
                </Link>
              );
            })}
            <div className='mt-5 flex flex-col gap-3'>
              <Link
                href={cta.mobileHref}
                onClick={() => setMobileMenuOpen(false)}
                className='flex w-full items-center justify-center gap-[6px] rounded-[8px] bg-[#dc2626] py-[13px] text-[14px] leading-[normal] font-semibold text-white transition-colors hover:bg-[#b91c1c]'
              >
                <span>{cta.mobileLabel}</span>
                <ArrowIcon />
              </Link>
              <a
                href={phoneHref}
                className='flex w-full items-center justify-center gap-[10px] rounded-[8px] border border-[#232328] bg-white/[0.03] py-[12px] text-[14px] leading-[normal] font-semibold text-white transition-colors hover:border-[#3a3a40]'
              >
                <PhoneIcon />
                <span>{phone}</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
