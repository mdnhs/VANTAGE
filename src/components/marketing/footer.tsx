import Image from 'next/image';
import Link from 'next/link';
import { cldUrl } from '@/lib/cloudinary/url';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { LottieLogo } from '@/components/ui/lottie-logo';
import { getSetting } from '@/server/queries/get-setting';

// Figma 131:674 assets
const FALLBACK_LOGO = '/assets/landing/27e96966dcba4218e85dc86d5723b210f88c7f2d.png';
const ICON_PIN = '/assets/landing/2a03e4d5b74a787cdd702f5fdaceccaad8b01220.svg';
const ICON_PHONE = '/assets/landing/3b54265d82d0a684fc845549256367dc317ab2f3.svg';
const ICON_MAIL = '/assets/landing/505ab23bbd9ddac293e2e54e3a46ff892cc018d4.svg';

const linkClass =
  'text-[14px] leading-[normal] text-[#a1a1a1] transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none';
const headingClass = 'text-[11px] leading-[normal] font-normal tracking-[0.88px] text-white uppercase';

// 18px icon box; inner insets reproduce Figma's group + stroke-bleed geometry
function ContactIcon({
  src,
  width,
  height,
  group,
  bleed,
}: {
  src: string;
  width: number;
  height: number;
  group: string;
  bleed: string;
}) {
  return (
    <span className='relative block size-[18px] shrink-0 overflow-clip'>
      <span className={`absolute ${group}`}>
        <span className={`absolute ${bleed}`}>
          <Image src={src} alt='' width={width} height={height} unoptimized className='block size-full max-w-none' />
        </span>
      </span>
    </span>
  );
}

// Server Component — reads settings via the cached service directly (no client fetch, no
// prop-drilling required since this is the only place these fields are needed). Rendered
// on every marketing page, so this is a repeated call to a `'use cache'`-wrapped function:
// Next.js dedupes identical cache-key reads within the same render, so it costs nothing extra.
export async function MarketingFooter() {
  const [settings, footer] = await Promise.all([siteSettingsService.getPublic(), getSetting('footer')]);
  const logoLottieJson = 'logoLottieJson' in settings ? settings.logoLottieJson : null;
  const logoUseLottie = 'logoUseLottie' in settings ? Boolean(settings.logoUseLottie) : false;

  const logoImage = (
    <Image
      src={settings.logoPublicId ? cldUrl(settings.logoPublicId, { height: 200 }) : FALLBACK_LOGO}
      alt={settings.businessName}
      width={240}
      height={136}
      className='h-[68px] w-[120px] object-contain'
    />
  );

  return (
    <footer className='border-t border-[#232328] bg-[#111113]'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-4 pt-16 pb-10 sm:px-6 sm:pt-20 lg:gap-[64px] lg:px-10 lg:pt-[96px] lg:pb-[40px] xl:px-0'>
        {/* Footer columns */}
        <div className='grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:flex lg:items-start lg:gap-[48px]'>
          {/* Brand */}
          <div className='flex flex-col items-start gap-[20px] lg:w-[320px] lg:shrink-0'>
            <Link href='/' aria-label={settings.businessName} className='block'>
              {logoUseLottie && logoLottieJson ? (
                <LottieLogo
                  data={logoLottieJson}
                  alt={settings.businessName}
                  className='h-[68px] w-[120px]'
                  fallback={logoImage}
                />
              ) : (
                logoImage
              )}
            </Link>
            <p className='max-w-[320px] text-[14px] leading-[23px] text-[#a1a1a1]'>{footer.blurb}</p>
          </div>

          {/* Link columns (Settings > Footer) */}
          {footer.columns.map((column) => (
            <div key={column.title} className='flex flex-col items-start gap-[20px] lg:min-w-px lg:flex-1'>
              <h4 className={headingClass}>{column.title}</h4>
              <nav className='flex flex-col items-start gap-[14px]'>
                {column.links.map((link) => (
                  <Link key={`${link.label}-${link.href}`} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          {/* Contact */}
          <div className='flex flex-col items-start gap-[20px] lg:min-w-px lg:flex-1'>
            <h4 className={headingClass}>Contact</h4>
            <div className='flex flex-col items-start gap-[14px]'>
              <div className='flex items-center gap-[12px]'>
                <ContactIcon
                  src={ICON_PIN}
                  width={14.627}
                  height={16.125}
                  group='inset-[8.33%_12.49%_8.33%_12.5%]'
                  bleed='inset-[-3.75%_-4.17%]'
                />
                <span className='text-[14px] leading-[normal] text-[#d4d4d4]'>{settings.address}</span>
              </div>
              <div className='flex items-center gap-[12px]'>
                <ContactIcon
                  src={ICON_PHONE}
                  width={14.6249}
                  height={14.625}
                  group='inset-[12.5%]'
                  bleed='inset-[-4.17%]'
                />
                <Link
                  href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                  className='text-[14px] leading-[normal] break-all text-[#d4d4d4] transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none'
                >
                  {settings.phone}
                </Link>
              </div>
              <div className='flex items-center gap-[12px]'>
                <ContactIcon
                  src={ICON_MAIL}
                  width={16.1252}
                  height={13.875}
                  group='inset-[14.58%_8.33%]'
                  bleed='inset-[-4.41%_-3.75%]'
                />
                <Link
                  href={`mailto:${settings.email}`}
                  className='text-[14px] leading-[normal] break-all text-[#d4d4d4] transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none'
                >
                  {settings.email}
                </Link>
              </div>
              {footer.contactNote && (
                <p className='max-w-[260px] text-[13px] leading-[20px] text-[#737373]'>{footer.contactNote}</p>
              )}
            </div>
          </div>
        </div>

        {/* Legal bar */}
        <div className='flex flex-col items-start justify-between gap-4 border-t border-[#232328] pt-[28px] sm:flex-row sm:items-center'>
          <span className='text-[11px] leading-[normal] tracking-[0.22px] text-[#737373]'>
            © 2026 {footer.copyrightName || settings.businessName}. {footer.legalNote}
          </span>
          <div className='flex flex-wrap gap-x-[28px] gap-y-2'>
            {footer.legalLinks.map((link) => (
              <Link key={`${link.label}-${link.href}`} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
