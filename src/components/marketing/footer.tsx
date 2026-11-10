import Image from 'next/image';
import Link from 'next/link';
import { sizedSrc } from '@/lib/media/public-image';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { LottieLogo } from '@/components/ui/lottie-logo';
import { getSetting } from '@/server/queries/get-setting';
import { legalPageService } from '@/server/services/legal-page-service';
import { collectMediaIds } from '@/lib/content/image-ref';
import { loadPublicImages } from '@/server/lib/media/resolve';
import { FooterSocials } from '@/components/marketing/footer-socials';

// Figma 131:674 assets
const FALLBACK_LOGO = '/assets/landing/27e96966dcba4218e85dc86d5723b210f88c7f2d.png';
const ICON_PIN = '/assets/landing/2a03e4d5b74a787cdd702f5fdaceccaad8b01220.svg';
const ICON_PHONE = '/assets/landing/3b54265d82d0a684fc845549256367dc317ab2f3.svg';
const ICON_MAIL = '/assets/landing/505ab23bbd9ddac293e2e54e3a46ff892cc018d4.svg';

const linkClass =
  'text-[13px] leading-[normal] text-[#a4abb6] transition-colors hover:text-[#f1f3f6] focus-visible:text-[#f1f3f6] focus-visible:outline-none sm:text-[14px]';
const columnLinkClass =
  'py-2.5 text-[15px] leading-[normal] text-[#c9ced6] transition-colors hover:text-[#f1f3f6] focus-visible:text-[#f1f3f6] focus-visible:outline-none sm:py-0 sm:text-[14px] sm:text-[#a4abb6]';
const headingClass =
  'text-[11px] leading-[normal] font-medium tracking-[0.88px] text-[#9aa1ac] uppercase sm:font-normal sm:text-[#f1f3f6]';
const contactRowClass =
  'flex items-center gap-[12px] max-sm:w-full max-sm:rounded-[12px] max-sm:border max-sm:border-[#353c47] max-sm:bg-[#262b34] max-sm:px-3 max-sm:py-2.5';

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
export async function MarketingFooter({ cookieSettings }: { cookieSettings?: React.ReactNode }) {
  const [settings, footer, legalPages] = await Promise.all([
    siteSettingsService.getPublic(),
    getSetting('footer'),
    legalPageService.listPublishedLinks(),
  ]);
  // Manual links first, then every published legal page (Dashboard → Legal pages); a manual
  // link to a legal page's address gives way to the page so it is listed once.
  const legalPaths = new Set(legalPages.map((page) => `/${page.slug}`));
  const legalLinks = [
    ...footer.legalLinks.filter((link) => link.label && link.href && !legalPaths.has(link.href)),
    ...legalPages.map((page) => ({ label: page.title, href: `/${page.slug}` })),
  ];
  // Social icons are media-library refs, resolved in one cached query (none: no query result needed).
  const socialIcons = await loadPublicImages(collectMediaIds(footer.socials));
  const socials = footer.socials.map((social) => ({
    name: social.name,
    url: social.url,
    icon: social.icon?.kind === 'media' ? (socialIcons[social.icon.id.toLowerCase()] ?? null) : null,
  }));
  const logoLottieJson = 'logoLottieJson' in settings ? settings.logoLottieJson : null;
  const logoUseLottie = 'logoUseLottie' in settings ? Boolean(settings.logoUseLottie) : false;

  const logoImage = (
    <Image
      src={settings.logo ? sizedSrc(settings.logo, 'h_200') : FALLBACK_LOGO}
      alt={settings.businessName}
      width={240}
      height={136}
      className='h-[48px] w-[84px] object-contain sm:h-[68px] sm:w-[120px]'
    />
  );

  return (
    <footer className='border-t border-[#353c47] bg-[#171a20] sm:border-[#2e343e] sm:bg-[#1b1f26]'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 pt-12 pb-10 sm:gap-12 sm:px-6 sm:pt-20 lg:gap-[64px] lg:px-10 lg:pt-[96px] lg:pb-[40px] xl:px-0'>
        {/* Footer columns */}
        <div className='grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-12 sm:gap-x-6 sm:gap-y-10 lg:flex lg:items-start lg:gap-[48px]'>
          {/* Brand */}
          <div className='col-span-2 flex flex-col items-start gap-[14px] sm:col-span-1 sm:gap-[20px] lg:w-[320px] lg:shrink-0'>
            <Link href='/' aria-label={settings.businessName} className='block'>
              {logoUseLottie && logoLottieJson ? (
                <LottieLogo
                  data={logoLottieJson}
                  alt={settings.businessName}
                  className='h-[48px] w-[84px] sm:h-[68px] sm:w-[120px]'
                  fallback={logoImage}
                />
              ) : (
                logoImage
              )}
            </Link>
            <p className='max-w-[320px] text-[14px] leading-[1.55] text-[#a4abb6] sm:leading-[23px]'>{footer.blurb}</p>
            <FooterSocials socials={socials} />
          </div>

          {/* Link columns (Settings > Footer) */}
          {footer.columns.map((column, index) => (
            <div
              key={`${column.title}-${index}`}
              className='flex flex-col items-start gap-1 max-sm:order-3 sm:gap-[20px] lg:min-w-px lg:flex-1'
            >
              <h3 className={headingClass}>{column.title}</h3>
              <nav className='flex flex-col items-start gap-1 sm:gap-[14px]'>
                {column.links
                  .filter((link) => link.label && link.href)
                  .map((link, i) => (
                    <Link key={`${link.label}-${link.href}-${i}`} href={link.href} className={columnLinkClass}>
                      {link.label}
                    </Link>
                  ))}
              </nav>
            </div>
          ))}

          {/* Contact */}
          <div className='col-span-2 flex flex-col items-start gap-[20px] max-sm:order-2 sm:col-span-1 lg:min-w-px lg:flex-1'>
            <h3 className={`${headingClass} max-sm:hidden`}>Contact</h3>
            <div className='flex w-full flex-col items-start gap-2 sm:w-auto sm:gap-[14px]'>
              <div className={contactRowClass}>
                <ContactIcon
                  src={ICON_PIN}
                  width={14.627}
                  height={16.125}
                  group='inset-[8.33%_12.49%_8.33%_12.5%]'
                  bleed='inset-[-3.75%_-4.17%]'
                />
                <span className='text-[15px] leading-[normal] font-semibold text-[#f1f3f6] sm:text-[14px] sm:font-normal sm:text-[#d5d9e0]'>
                  {settings.address}
                </span>
              </div>
              <div className={contactRowClass}>
                <ContactIcon
                  src={ICON_PHONE}
                  width={14.6249}
                  height={14.625}
                  group='inset-[12.5%]'
                  bleed='inset-[-4.17%]'
                />
                <Link
                  href={settings.phoneHref}
                  className='text-[15px] leading-[normal] font-semibold break-all text-[#f1f3f6] transition-colors hover:text-[#f1f3f6] focus-visible:text-[#f1f3f6] focus-visible:outline-none sm:text-[14px] sm:font-normal sm:text-[#d5d9e0]'
                >
                  {settings.phone}
                </Link>
              </div>
              <div className={contactRowClass}>
                <ContactIcon
                  src={ICON_MAIL}
                  width={16.1252}
                  height={13.875}
                  group='inset-[14.58%_8.33%]'
                  bleed='inset-[-4.41%_-3.75%]'
                />
                <Link
                  href={`mailto:${settings.email}`}
                  className='text-[15px] leading-[normal] font-semibold break-all text-[#f1f3f6] transition-colors hover:text-[#f1f3f6] focus-visible:text-[#f1f3f6] focus-visible:outline-none sm:text-[14px] sm:font-normal sm:text-[#d5d9e0]'
                >
                  {settings.email}
                </Link>
              </div>
              {footer.contactNote && (
                <p className='max-w-[260px] text-[13px] leading-[20px] text-[#7d8591]'>{footer.contactNote}</p>
              )}
            </div>
          </div>
        </div>

        {/* Legal bar */}
        <div className='flex flex-col-reverse items-start justify-between gap-3 border-t border-[#353c47] pt-5 sm:flex-row sm:items-center sm:gap-4 sm:border-[#2e343e] sm:pt-[28px]'>
          <span className='text-[12px] leading-[normal] text-[#7d8591] sm:text-[11px] sm:tracking-[0.22px]'>
            © 2026 {footer.copyrightName || settings.businessName}. {footer.legalNote}
          </span>
          <div className='flex flex-wrap gap-x-5 gap-y-2 sm:gap-x-[28px]'>
            {legalLinks.map((link) => (
              <Link key={`${link.label}-${link.href}`} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            {cookieSettings}
          </div>
        </div>
      </div>
    </footer>
  );
}
