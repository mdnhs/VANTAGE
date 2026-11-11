'use client';

import { useInsuranceEnabled } from '@/contexts/insurance-context';
import { visibleLink } from '@/lib/features';
import { RevealContent } from '@/components/marketing/ui/reveal-content';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';
import { LottieLogo } from '@/components/ui/lottie-logo';
import { telHref, whatsappHref } from '@/lib/content/phone';
import type { GlobalValue } from '@/lib/content/globals';
import { QUOTE_HREF, QuoteCtaText } from '@/components/marketing/quote-cta';

const ICON_PHONE = '/assets/landing/0943df176868fa54f9c4d56f120f2cb266e6fd3b.svg';
const ICON_ARROW = '/assets/landing/2065fb2a6a3ee56f9cd715ecf7f319a2a65ffe90.svg';
const LOGO_WHATSAPP = '/assets/landing/09936fdd2159e847dcf168e3160a539c758f5211.svg';
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

function PhoneIcon({ className = '' }: { className?: string }) {
  return (
    <span className={`relative block size-[18px] shrink-0 overflow-clip ${className}`}>
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

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <span className={`relative block size-[16px] shrink-0 overflow-clip ${className}`}>
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
  const insurance = useInsuranceEnabled();
  const desktopLinks = navigation.links.filter(
    (link) => link.label && link.href && !link.mobileOnly && visibleLink(link, insurance),
  );
  const mobileLinks = navigation.links.filter((link) => link.label && link.href && visibleLink(link, insurance));
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
      className='h-[36px] w-[63px] object-contain sm:h-[56px] sm:w-[98px]'
      priority
    />
  );

  return (
    // MAIN STICKY NAVIGATION
    <header className='sticky top-0 z-40 w-full border-b border-[#353c47] bg-[rgba(27,31,38,0.94)] backdrop-blur-[8px] sm:border-[#2e343e] sm:bg-[#1b1f26] sm:backdrop-blur-none'>
      <div className='mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 py-2 pr-4 pl-5 sm:px-6 sm:py-3 lg:px-10 xl:px-0'>
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
              className='h-[36px] w-[63px] sm:h-[56px] sm:w-[98px]'
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
                className={`relative text-[14px] leading-[normal] font-medium whitespace-nowrap transition-colors focus-visible:text-[#f1f3f6] focus-visible:outline-none ${
                  active ? 'text-[#f1f3f6]' : 'text-[#a4abb6] hover:text-[#f1f3f6]'
                }`}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden
                    className='absolute -bottom-2 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-brand'
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className='flex items-center gap-2 sm:gap-[32px]'>
          <a
            href={phoneHref}
            className='group hidden items-center gap-[10px] rounded-[8px] border border-brand bg-brand px-[18px] py-[10px] text-[14px] leading-normal font-semibold whitespace-nowrap text-[#f1f3f6] shadow-[0_8px_14px_rgb(var(--brand-rgb)/0.35)] transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1f26] focus-visible:outline-none md:flex'
          >
            <PhoneIcon className='motion-safe:group-hover:animate-[phone-ring_1.4s_ease-in-out_infinite] motion-safe:group-focus-visible:animate-[phone-ring_1.4s_ease-in-out_infinite]' />
            <span>{phone}</span>
          </a>

          {/* Phones only: round call button next to the menu button */}
          <a
            href={phoneHref}
            aria-label='Call us'
            className='flex size-[40px] items-center justify-center rounded-[12px] border border-brand bg-brand text-[#f1f3f6] transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:hidden'
          >
            <PhoneIcon className='size-[20px]' />
          </a>

          {/* Mobile menu: right-side sheet with every link, the quote button and the phone */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              className='flex size-[40px] items-center justify-center rounded-[12px] border border-[#353c47] bg-[#2e343e] text-[#f1f3f6] transition-colors hover:border-[#3e4551] hover:text-[#f1f3f6] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:size-[42px] sm:rounded-[8px] sm:border-[#2e343e] sm:bg-transparent sm:text-[#a4abb6] lg:hidden'
              aria-label='Toggle navigation menu'
            >
              <Menu className='size-5' />
            </SheetTrigger>
            <SheetContent
              side='right'
              showCloseButton={false}
              className='w-full gap-0 border-[#2e343e] bg-[#1b1f26] p-0 text-[#f1f3f6] sm:w-[85%] sm:max-w-sm lg:hidden'
            >
              <div className='flex items-center justify-between border-b border-[#353c47] py-[10px] pr-4 pl-5 sm:px-5 sm:py-4'>
                <SheetTitle className='text-[11px] font-normal tracking-[0.88px] text-[#f1f3f6] uppercase'>
                  Menu
                </SheetTitle>
                <SheetClose
                  className='flex size-[44px] items-center justify-center rounded-[12px] border border-[#353c47] bg-[#2e343e] text-[#f1f3f6] transition-colors hover:border-[#3e4551] hover:text-[#f1f3f6] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:size-[38px] sm:rounded-[8px] sm:border-[#2e343e] sm:bg-transparent sm:text-[#a4abb6]'
                  aria-label='Close navigation menu'
                >
                  <X className='size-5' />
                </SheetClose>
              </div>
              <nav className='flex flex-col px-5 py-3 sm:py-0'>
                {mobileLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={`${link.label}-${link.href}`}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex h-14 items-center justify-between border-b border-[#353c47] px-1 font-site-heading text-[22px] leading-[normal] font-extrabold transition-colors sm:h-auto sm:border-[#2e343e] sm:px-0 sm:py-[14px] sm:font-site-body sm:text-[15px] sm:font-medium ${
                        active ? 'text-[#f1f3f6]' : 'text-[#c9ced6] hover:text-[#f1f3f6] sm:text-[#a4abb6]'
                      }`}
                    >
                      <span className='flex items-center gap-[10px]'>
                        {active && <span className='size-[6px] rounded-full bg-brand sm:hidden' />}
                        {link.label}
                      </span>
                      {active && <span className='hidden size-[6px] rounded-full bg-brand sm:block' />}
                      <ChevronRight
                        aria-hidden
                        className={`size-[18px] shrink-0 sm:hidden ${active ? 'text-brand' : 'text-[#a4abb6]'}`}
                      />
                    </Link>
                  );
                })}
              </nav>
              <div className='mt-auto flex flex-col gap-[10px] px-5 pt-4 pb-8 sm:gap-3 sm:pt-6'>
                <Link
                  data-reveal-button
                  href={QUOTE_HREF}
                  onClick={() => setMobileMenuOpen(false)}
                  className='relative flex min-h-[52px] w-full items-center justify-center gap-[6px] overflow-hidden rounded-[12px] border border-brand bg-brand py-[12px] text-[15px] leading-[normal] font-semibold text-[#f1f3f6] transition-colors hover:bg-brand-hover max-sm:shadow-[0_8px_10px_color-mix(in_srgb,var(--color-brand)_30%,transparent)] sm:min-h-0 sm:rounded-[8px] sm:text-[14px]'
                >
                  <RevealContent band='dark' className='gap-[6px]'>
                    <span>
                      <QuoteCtaText />
                    </span>
                    <ArrowIcon />
                  </RevealContent>
                </Link>
                <a
                  data-reveal-button
                  href={phoneHref}
                  className='relative hidden min-h-[52px] w-full items-center justify-center gap-[10px] overflow-hidden rounded-[12px] border border-[#3e4551] bg-[#2e343e] py-[12px] text-[15px] leading-[normal] font-semibold text-[#f1f3f6] transition-colors hover:border-[#3e4551] sm:flex sm:min-h-0 sm:rounded-[8px] sm:border-[#2e343e] sm:bg-white/[0.03] sm:text-[14px]'
                >
                  <RevealContent band='brand' className='gap-[10px]'>
                    <PhoneIcon />
                    <span>{phone}</span>
                  </RevealContent>
                </a>
                {/* Phones: Call and WhatsApp side by side */}
                <div className='flex gap-[10px] sm:hidden'>
                  <a
                    href={phoneHref}
                    className='flex min-h-[52px] min-w-0 flex-1 items-center justify-center gap-[10px] rounded-[12px] border border-[#3e4551] bg-[#2e343e] px-[20px] text-[15px] leading-[normal] font-semibold text-[#f1f3f6] transition-colors hover:border-[#4a5260] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'
                  >
                    <PhoneIcon />
                    <span>Call</span>
                  </a>
                  <a
                    href={whatsappHref(phone)}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex min-h-[52px] min-w-0 flex-1 items-center justify-center gap-[10px] rounded-[12px] border border-[#3e4551] bg-[#2e343e] px-[20px] text-[15px] leading-[normal] font-semibold text-[#f1f3f6] transition-colors hover:border-[#4a5260] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'
                  >
                    <span className='flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#23b33a]'>
                      <Image src={LOGO_WHATSAPP} alt='' width={16} height={16} unoptimized className='size-[16px]' />
                    </span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
