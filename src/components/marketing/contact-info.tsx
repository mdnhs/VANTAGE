import { TiltArticle } from '@/components/marketing/ui/tilt-article';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { BODY_TEXT, CARD, SectionHeader } from '@/components/marketing/ui/landing-primitives';
import { whatsappHref } from '@/lib/content/phone';
import { getSetting } from '@/server/queries/get-setting';
import { siteSettingsService } from '@/server/services/site-settings-service';

const LABEL =
  'font-site-body text-[11px] leading-normal tracking-[0.66px] text-[#a4abb6] uppercase sm:font-semibold sm:text-[#7d8591]';

// Card with the homepage services icon tile (white chip, dark glyph) — no Figma glyph exists
// for these, so lucide icons sit in the same treatment.
function InfoCard({
  icon: Icon,
  label,
  children,
  className = '',
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TiltArticle
      className={`${CARD} group flex min-w-0 flex-col items-start gap-3.5 p-[17px] transition-colors duration-300 hover:border-brand/60 sm:flex-row sm:items-center sm:gap-5 sm:p-6 lg:gap-[18px] ${className}`}
    >
      <span className='flex shrink-0 items-center justify-center rounded-xl bg-[#f1f3f6] p-2.5 transition duration-300 group-hover:scale-105 sm:p-3'>
        <Icon aria-hidden className='size-5 text-[#1b1f26] sm:size-6' strokeWidth={1.75} />
      </span>
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <span className={LABEL}>{label}</span>
        {children}
      </div>
      <ArrowUpRight aria-hidden className='hidden size-5 shrink-0 text-[#7d8591] sm:block' />
    </TiltArticle>
  );
}

// Server Component — reads settings via the cached service directly, same pattern as
// footer.tsx, so headquarters address / phone / email / WhatsApp stay in sync with the
// admin-managed site settings instead of being hardcoded per-page.
export async function ContactInfo() {
  const [settings, microcopy] = await Promise.all([siteSettingsService.getPublic(), getSetting('microcopy')]);
  const copy = microcopy.contactInfo;

  return (
    <div className='flex flex-col gap-7 pb-12 sm:gap-10 sm:pb-0 lg:gap-4'>
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} accent={copy.accent} />

      <div className='grid w-full grid-cols-2 gap-2.5 sm:flex sm:flex-col sm:gap-4'>
        <InfoCard icon={MapPin} label={copy.headquarters} className='order-3 col-span-2'>
          <span
            className={`${BODY_TEXT} sm:font-site-heading sm:text-[19px] sm:leading-normal sm:font-bold sm:text-[#f1f3f6]`}
          >
            {settings.address}
          </span>
        </InfoCard>

        <InfoCard icon={Phone} label={copy.directLine} className='order-1'>
          <Link
            href={settings.phoneHref}
            className='w-fit max-w-full truncate rounded-sm font-site-heading text-[16px] leading-[22px] font-extrabold tracking-[-0.2px] text-[#f1f3f6] transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:text-[19px] sm:leading-normal sm:tracking-normal'
          >
            {settings.phone}
          </Link>
          {settings.whatsappNumber && (
            <div className='mt-3 border-t border-[#2e343e] pt-3 sm:pt-4'>
              <Link
                href={whatsappHref(settings.whatsappNumber)}
                target='_blank'
                rel='noopener noreferrer'
                className='sm:py-2/60 inline-flex w-fit items-center gap-2 rounded-full border border-[#353c47] bg-[#20252d] px-3 py-1.5 transition-colors hover:border-[#25d366] hover:bg-[#25d366]/10 focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:outline-none sm:px-4'
              >
                <Image src='/assets/marketing/icon-whatsapp.svg' alt='' width={16} height={16} className='size-4' />
                <span className='font-site-body text-[11px] leading-normal tracking-[0.66px] text-[#d5d9e0] uppercase'>
                  {copy.whatsapp}
                </span>
              </Link>
            </div>
          )}
        </InfoCard>

        <InfoCard icon={Mail} label={copy.email} className='order-2'>
          <Link
            href={`mailto:${settings.email}`}
            className={`${BODY_TEXT} w-fit max-w-full rounded-sm break-all transition-colors hover:text-[#f1f3f6] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none sm:font-site-heading sm:text-[19px] sm:leading-normal sm:font-bold sm:text-[#f1f3f6]`}
          >
            {settings.email}
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
