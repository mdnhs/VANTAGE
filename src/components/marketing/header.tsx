'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '#services' },
  { label: 'Our Work', href: '/our-work' },
  { label: 'Insurance', href: '#insurance' },
  { label: 'About', href: '#about' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

export function MarketingHeader() {
  const pathname = usePathname();

  return (
    <header className='sticky top-0 z-50 border-b border-white/10 bg-[#131313]/80 backdrop-blur-md'>
      <div className='flex h-20 items-center justify-between px-6 sm:px-12'>
        <div className='flex items-center gap-4'>
          <Image
            src='/assets/marketing/logo.jpg'
            alt='Vantage Autobody logo'
            width={40}
            height={40}
            className='size-10'
          />
          <span className='font-[family-name:var(--font-manrope)] text-2xl font-semibold tracking-[-0.6px] text-[#e5e2e1] uppercase'>
            Vantage
          </span>
        </div>

        <nav className='hidden items-center gap-8 lg:flex'>
          {NAV_LINKS.map((link) => {
            const isActive = link.href.startsWith('/') && pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={
                  isActive
                    ? 'text-base font-bold tracking-[1.6px] text-[#ffb4ab] uppercase'
                    : 'text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase transition-colors hover:text-[#e5e2e1]'
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className='flex items-center gap-6'>
          <Link
            href='#quote'
            className='bg-[#dc2626] px-8 py-3 text-xs font-semibold tracking-[1.2px] text-[#fff6f5] uppercase transition-colors hover:bg-[#dc2626]/90'
          >
            Get a Free Quote
          </Link>
          <Image
            src='/assets/marketing/profile.jpg'
            alt='Account'
            width={32}
            height={32}
            className='size-8 rounded-full border border-white/10 object-cover'
          />
        </div>
      </div>
    </header>
  );
}
