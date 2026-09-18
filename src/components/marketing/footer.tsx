import Image from 'next/image';
import Link from 'next/link';
import { cldUrl } from '@/lib/cloudinary/url';
import { siteSettingsService } from '@/server/services/site-settings-service';

const SERVICES_LINKS = [
  { label: 'Collision Repair', href: '/services' },
  { label: 'Precision Respraying', href: '/services' },
  { label: 'Classic Restoration', href: '/services' },
  { label: 'Dent Removal', href: '/services' },
];

const COMPANY_LINKS = [
  { label: 'Our Process', href: '/process' },
  { label: 'Insurance Partners', href: '/insurance' },
  { label: 'Showcase', href: '/our-work' },
  { label: 'About Us', href: '/about' },
];

const SOCIAL_LINKS = [
  { key: 'facebookUrl', icon: '/assets/marketing/icon-social-1.svg' },
  { key: 'instagramUrl', icon: '/assets/marketing/icon-social-2.svg' },
  { key: 'tiktokUrl', icon: '/assets/marketing/icon-social-3.svg' },
] as const;

// Server Component — reads settings via the cached service directly (no client fetch, no
// prop-drilling required since this is the only place these fields are needed). Rendered
// on every marketing page, so this is a repeated call to a `'use cache'`-wrapped function:
// Next.js dedupes identical cache-key reads within the same render, so it costs nothing extra.
export async function MarketingFooter() {
  const settings = await siteSettingsService.getPublic();

  return (
    <footer className='border-t border-white/5 bg-[#0e0e0e]'>
      <div className='container mx-auto flex flex-col gap-12 px-4 pt-14 pb-10 sm:gap-16 sm:px-6 sm:pt-20 sm:pb-12 md:px-12 lg:gap-[120px] lg:pt-[121px]'>
        <div className='grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-4'>
          <div className='flex flex-col gap-6'>
            <Image
              src={
                settings.logoPublicId ? cldUrl(settings.logoPublicId, { height: 200 }) : '/assets/marketing/logo.jpg'
              }
              alt={settings.businessName}
              width={320}
              height={200}
              className='h-16 w-auto self-start object-contain sm:h-20'
            />
            <p className='max-w-[320px] text-sm leading-relaxed text-neutral-400 sm:text-base sm:leading-6'>
              Excellence in precision automotive restoration and high-end repair since 1998. Your vehicle, our
              obsession.
            </p>
            <div className='flex gap-4'>
              {SOCIAL_LINKS.filter((social) => Boolean(settings[social.key])).map((social) => (
                <Link
                  key={social.key}
                  href={settings[social.key] as string}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex size-10 items-center justify-center rounded-full bg-[#201f1f] text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white'
                >
                  <Image src={social.icon} alt='' width={15} height={15} className='size-[15px]' />
                </Link>
              ))}
            </div>
          </div>

          <div className='flex flex-col gap-4 sm:gap-6'>
            <h4 className='text-xs font-semibold tracking-[1.2px] text-white uppercase'>Services</h4>
            <nav className='flex flex-col gap-3'>
              {SERVICES_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className='text-sm text-neutral-400 transition-colors hover:text-white sm:text-base'
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className='flex flex-col gap-4 sm:gap-6'>
            <h4 className='text-xs font-semibold tracking-[1.2px] text-white uppercase'>Company</h4>
            <nav className='flex flex-col gap-3'>
              {COMPANY_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className='text-sm text-neutral-400 transition-colors hover:text-white sm:text-base'
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className='flex flex-col gap-4 sm:gap-6'>
            <h4 className='text-xs font-semibold tracking-[1.2px] text-white uppercase'>Contact</h4>
            <div className='flex flex-col gap-4'>
              <div className='flex items-start gap-3'>
                <Image
                  src='/assets/marketing/icon-location.svg'
                  alt=''
                  width={16}
                  height={20}
                  className='mt-0.5 h-5 w-4 shrink-0'
                />
                <span className='text-sm leading-relaxed text-neutral-400 sm:text-base sm:leading-6'>
                  {settings.address}
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <Image
                  src='/assets/marketing/icon-phone.svg'
                  alt=''
                  width={18}
                  height={18}
                  className='size-[18px] shrink-0'
                />
                <Link
                  href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                  className='text-sm break-all text-neutral-400 transition-colors hover:text-white sm:text-base'
                >
                  {settings.phone}
                </Link>
              </div>
              <div className='flex items-center gap-3'>
                <Image
                  src='/assets/marketing/icon-email.svg'
                  alt=''
                  width={20}
                  height={16}
                  className='h-4 w-5 shrink-0'
                />
                <Link
                  href={`mailto:${settings.email}`}
                  className='text-sm break-all text-neutral-400 transition-colors hover:text-white sm:text-base'
                >
                  {settings.email}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-center sm:flex-row sm:text-left'>
          <span className='text-xs font-semibold tracking-[1.2px] text-neutral-500 uppercase'>
            © 2024 {settings.businessName}. Registered in Ireland.
          </span>
          <div className='flex flex-wrap justify-center gap-6 sm:gap-8'>
            <Link
              href='#privacy'
              className='text-xs font-semibold tracking-[1.2px] text-neutral-500 uppercase transition-colors hover:text-neutral-300'
            >
              Privacy Policy
            </Link>
            <Link
              href='#terms'
              className='text-xs font-semibold tracking-[1.2px] text-neutral-500 uppercase transition-colors hover:text-neutral-300'
            >
              Terms of Service
            </Link>
            <Link
              href='/login'
              className='text-xs font-semibold tracking-[1.2px] text-neutral-500 uppercase transition-colors hover:text-neutral-300'
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
