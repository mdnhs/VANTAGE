'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';
import { LottieLogo } from '@/components/ui/lottie-logo';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Our Work', href: '/our-work' },
  { label: 'Insurance', href: '/insurance' },
  { label: 'About', href: '/about' },
  { label: 'Process', href: '/process' },
  { label: 'Contact', href: '/contact' },
];

interface StitchHeaderProps {
  phone: string;
  businessName: string;
  logoPublicId: string | null;
  logoLottieUrl?: string | null;
  logoUseLottie?: boolean;
}

export function StitchHeader({
  phone,
  businessName,
  logoPublicId,
  logoLottieUrl,
  logoUseLottie = false,
}: StitchHeaderProps) {
  const phoneHref = `tel:${phone.replace(/\s/g, '')}`;
  const logoSrc = logoPublicId ? cldUrl(logoPublicId, { height: 240 }) : '/assets/marketing/logo.jpg';

  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    // MAIN STICKY NAVIGATION
    <header className='sticky top-0 z-40 w-full border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur-xl transition-all'>
      <div className='container mx-auto flex items-center justify-between gap-3 px-4 py-1 sm:gap-6 sm:px-6 sm:py-1.5 md:py-2 lg:px-12'>
        {/* Logo */}
        <Link href='/' className='flex shrink-0 items-center'>
          {logoUseLottie && logoLottieUrl ? (
            <LottieLogo
              data={logoLottieUrl}
              alt={businessName}
              className='h-12 w-auto max-w-[220px] sm:h-16 sm:max-w-[280px] md:h-20 md:max-w-[340px] lg:h-[88px] lg:max-w-[380px]'
              fallback={
                <Image
                  src={logoSrc}
                  alt={businessName}
                  width={380}
                  height={200}
                  className='h-12 w-auto object-contain sm:h-16 md:h-20 lg:h-[88px]'
                  priority
                />
              }
            />
          ) : (
            <Image
              src={logoSrc}
              alt={businessName}
              width={380}
              height={200}
              className='h-12 w-auto object-contain sm:h-16 md:h-20 lg:h-[88px]'
              priority
            />
          )}
        </Link>

        {/* Desktop Nav Links */}
        <nav className='hidden items-center gap-7 xl:flex'>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`py-1 text-xs font-semibold tracking-widest uppercase transition-colors ${
                pathname === link.href
                  ? 'border-b-2 border-[#dc2626] text-[#dc2626]'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className='flex items-center gap-2 sm:gap-4'>
          <a href={phoneHref} className='hidden flex-col pr-2 text-right sm:flex'>
            <span className='font-mono text-[10px] tracking-wider text-neutral-400 uppercase'>Crash Direct Line</span>
            <span className='text-sm font-semibold tracking-tight text-white transition-colors hover:text-[#dc2626]'>
              {phone}
            </span>
          </a>

          <Link
            href='/#estimator'
            className='flex shrink-0 items-center gap-1.5 rounded bg-[#dc2626] px-3.5 py-2 text-[11px] font-bold tracking-wider text-white uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:bg-red-700 sm:gap-2 sm:px-6 sm:py-3 sm:text-xs'
          >
            <span>
              <span className='xs:inline hidden'>Get a Free </span>Quote
            </span>
            <ArrowRight className='size-3 sm:size-3.5' />
          </Link>

          {/* Mobile Hamburger */}
          <button
            type='button'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='flex size-9 items-center justify-center rounded border border-white/10 text-neutral-300 hover:text-white sm:size-10 xl:hidden'
            aria-label='Toggle navigation menu'
          >
            {mobileMenuOpen ? <X className='size-5' /> : <Menu className='size-5' />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className='border-b border-white/10 bg-[#121212] px-4 py-5 shadow-2xl sm:px-6 xl:hidden'>
          <nav className='flex flex-col gap-3'>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-md px-2 py-1.5 text-sm font-semibold tracking-wider uppercase transition-colors ${
                  pathname === link.href ? 'bg-red-500/10 text-[#dc2626]' : 'text-neutral-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className='mt-3 flex flex-col gap-2.5 border-t border-white/10 pt-4'>
              <Link
                href='/get-a-quote'
                onClick={() => setMobileMenuOpen(false)}
                className='flex w-full items-center justify-center gap-2 rounded bg-[#dc2626] py-3 text-xs font-bold tracking-wider text-white uppercase shadow-md hover:bg-red-700'
              >
                <span>Request Free Quote Online</span>
                <ArrowRight className='size-3.5' />
              </Link>
              <a
                href={phoneHref}
                className='flex items-center gap-2 rounded-md bg-white/5 px-3 py-2.5 text-sm font-medium text-neutral-200'
              >
                <Phone className='size-4 text-[#dc2626]' />
                <span>{phone} (Direct Hotline)</span>
              </a>
              <span className='flex items-center gap-2 px-1 text-xs text-neutral-400'>
                <ShieldCheck className='size-4 shrink-0 text-emerald-500' />
                Irish Certified Technicians &amp; NCT Approved
              </span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
