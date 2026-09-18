'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, Phone, ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '#services' },
  { label: 'Estimate Quote', href: '#estimator' },
  { label: 'Our Work', href: '#work' },
  { label: 'Process', href: '#process' },
  { label: 'Insurance', href: '#insurance' },
  { label: 'Contact', href: '#contact' },
];

export function StitchHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* TOP UTILITY BAR */}
      <div className='hidden w-full border-b border-white/5 bg-[#0a0a0a] px-4 py-2.5 font-mono text-[12px] tracking-wide text-neutral-400 md:block'>
        <div className='mx-auto flex max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-6'>
            <span className='flex items-center gap-1.5 transition-colors hover:text-white'>
              <MapPin className='size-3.5 text-[#dc2626]' />
              Unit 4, Industrial Estate, Dublin Road, Ireland
            </span>
            <span className='text-neutral-700'>|</span>
            <span className='flex items-center gap-1.5'>
              <Clock className='size-3.5 text-emerald-500' />
              Mon–Fri: 08:00 – 18:00
            </span>
          </div>

          <div className='flex items-center gap-6'>
            <span className='inline-flex items-center gap-1.5 text-xs text-neutral-300'>
              <span className='size-1.5 animate-pulse rounded-full bg-emerald-500' />
              Irish Certified Technicians &amp; NCT Approved Repairs
            </span>
            <span className='text-neutral-700'>|</span>
            <a
              href='tel:+35312345678'
              className='flex items-center gap-1.5 font-medium text-white transition-colors hover:text-[#dc2626]'
            >
              <Phone className='size-3.5 text-[#dc2626]' />
              +353 1 234 5678
            </a>
          </div>
        </div>
      </div>

      {/* MAIN STICKY NAVIGATION */}
      <header className='sticky top-0 z-40 w-full border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur-xl transition-all'>
        <div className='mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8'>
          {/* Logo */}
          <Link href='/' className='group flex items-center gap-3'>
            <div className='relative size-11 overflow-hidden rounded-md border border-white/10 transition-all group-hover:border-[#dc2626]/60'>
              <Image
                src='/assets/marketing/stitch-logo.png'
                alt='Vantage Autobody Logo'
                fill
                className='object-contain p-0.5'
                priority
              />
            </div>
            <div className='flex flex-col'>
              <span className='font-[family-name:var(--font-manrope)] text-xl leading-none font-bold tracking-wider text-white uppercase transition-colors group-hover:text-[#dc2626]'>
                VANTAGE
              </span>
              <span className='mt-1 font-mono text-[9px] tracking-[0.25em] text-neutral-400 uppercase'>
                AUTOBODY • DUBLIN
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className='hidden items-center gap-7 xl:flex'>
            {NAV_LINKS.map((link, idx) => (
              <a
                key={link.label}
                href={link.href}
                className={`py-1 text-xs font-semibold tracking-widest uppercase transition-colors ${
                  idx === 0 ? 'border-b-2 border-[#dc2626] text-[#dc2626]' : 'text-neutral-300 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className='flex items-center gap-4'>
            <a href='tel:+35312345678' className='hidden flex-col pr-2 text-right sm:flex'>
              <span className='font-mono text-[10px] tracking-wider text-neutral-400 uppercase'>Crash Direct Line</span>
              <span className='text-sm font-semibold tracking-tight text-white transition-colors hover:text-[#dc2626]'>
                +353 1 234 5678
              </span>
            </a>

            <a
              href='#estimator'
              className='flex items-center gap-2 rounded bg-[#dc2626] px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:bg-red-700'
            >
              <span>Get a Free Quote</span>
              <ArrowRight className='size-3.5' />
            </a>

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
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className='text-sm font-semibold tracking-wider text-neutral-300 uppercase transition-colors hover:text-white'
                >
                  {link.label}
                </a>
              ))}
              <div className='mt-3 flex flex-col gap-2 border-t border-white/10 pt-3'>
                <a href='tel:+35312345678' className='flex items-center gap-2 text-sm text-neutral-200'>
                  <Phone className='size-4 text-[#dc2626]' />
                  +353 1 234 5678 (Direct Hotline)
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
    </>
  );
}
