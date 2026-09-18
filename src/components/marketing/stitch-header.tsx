'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';

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
}

export function StitchHeader({ phone, businessName, logoPublicId }: StitchHeaderProps) {
  const phoneHref = `tel:${phone.replace(/\s/g, '')}`;
  const logoSrc = logoPublicId ? cldUrl(logoPublicId, { height: 112 }) : '/assets/marketing/logo.jpg';

  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    // MAIN STICKY NAVIGATION
    <header className='sticky top-0 z-40 w-full border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur-xl transition-all'>
      <div className='container mx-auto flex h-20 items-center justify-between gap-6 px-6 sm:px-12'>
        {/* Logo */}
        <Link href='/' className='flex shrink-0 items-center'>
          <Image
            src={logoSrc}
            alt={businessName}
            width={200}
            height={112}
            className='h-12 w-auto object-contain sm:h-14'
            priority
          />
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
        <div className='flex items-center gap-4'>
          <a href={phoneHref} className='hidden flex-col pr-2 text-right sm:flex'>
            <span className='font-mono text-[10px] tracking-wider text-neutral-400 uppercase'>Crash Direct Line</span>
            <span className='text-sm font-semibold tracking-tight text-white transition-colors hover:text-[#dc2626]'>
              {phone}
            </span>
          </a>

          <Link
            href='/#estimator'
            className='flex items-center gap-2 rounded bg-[#dc2626] px-6 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:bg-red-700'
          >
            <span>Get a Free Quote</span>
            <ArrowRight className='size-3.5' />
          </Link>

          {/* Mobile Hamburger */}
          <button
            type='button'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='flex size-10 items-center justify-center rounded border border-white/10 text-neutral-300 hover:text-white xl:hidden'
            aria-label='Toggle navigation menu'
          >
            {mobileMenuOpen ? <X className='size-5' /> : <Menu className='size-5' />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className='border-b border-white/10 bg-[#121212] px-6 py-5 xl:hidden'>
          <nav className='flex flex-col gap-3'>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className='text-sm font-semibold tracking-wider text-neutral-300 uppercase transition-colors hover:text-white'
              >
                {link.label}
              </Link>
            ))}
            <div className='mt-3 flex flex-col gap-2 border-t border-white/10 pt-3'>
              <a href={phoneHref} className='flex items-center gap-2 text-sm text-neutral-200'>
                <Phone className='size-4 text-[#dc2626]' />
                {phone} (Direct Hotline)
              </a>
              <span className='flex items-center gap-2 text-xs text-neutral-400'>
                <ShieldCheck className='size-4 text-emerald-500' />
                Irish Certified Technicians &amp; NCT Approved
              </span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
