import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { BODY_TEXT, CARD, SectionHeader } from '@/components/marketing/ui/landing-primitives';
import { siteSettingsService } from '@/server/services/site-settings-service';

const LABEL =
  'font-[family-name:var(--font-inter)] text-[11px] leading-normal tracking-[0.66px] text-[#a1a1a1] uppercase';

// Card with the homepage services icon tile (white chip, dark glyph) — no Figma glyph exists
// for these, so lucide icons sit in the same treatment.
function InfoCard({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <article
      className={`${CARD} group flex items-start gap-5 p-6 transition-colors duration-300 hover:border-[#dc2626]/60`}
    >
      <span className='flex shrink-0 items-center justify-center rounded-xl bg-white p-3 transition-transform duration-300 group-hover:scale-105'>
        <Icon aria-hidden className='size-6 text-[#111113]' strokeWidth={1.75} />
      </span>
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        <span className={LABEL}>{label}</span>
        {children}
      </div>
    </article>
  );
}

// Server Component — reads settings via the cached service directly, same pattern as
// footer.tsx, so headquarters address / phone / email / WhatsApp stay in sync with the
// admin-managed site settings instead of being hardcoded per-page.
export async function ContactInfo() {
  const settings = await siteSettingsService.getPublic();

  return (
    <div className='flex flex-col gap-10'>
      <SectionHeader eyebrow='Contact details' title='Talk to' accent='the team.' />

      <div className='flex w-full flex-col gap-4'>
        <InfoCard icon={MapPin} label='Headquarters'>
          <span className={BODY_TEXT}>{settings.address}</span>
        </InfoCard>

        <InfoCard icon={Phone} label='Direct line'>
          <Link
            href={`tel:${settings.phone.replace(/\s+/g, '')}`}
            className='w-fit max-w-full truncate rounded-sm font-[family-name:var(--font-manrope)] text-[22px] leading-[30px] font-extrabold tracking-[-0.44px] text-white transition-colors hover:text-[#dc2626] focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:outline-none'
          >
            {settings.phone}
          </Link>
          {settings.whatsappNumber && (
            <div className='mt-3 border-t border-[#232328] pt-4'>
              <Link
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex w-fit items-center gap-2 rounded-full border border-[#2a2a30] bg-[#16161a] px-4 py-2 transition-colors hover:border-[#25d366]/60 hover:bg-[#25d366]/10 focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:outline-none'
              >
                <Image src='/assets/marketing/icon-whatsapp.svg' alt='' width={16} height={16} className='size-4' />
                <span className='font-[family-name:var(--font-inter)] text-[11px] leading-normal tracking-[0.66px] text-[#d4d4d4] uppercase'>
                  WhatsApp us
                </span>
              </Link>
            </div>
          )}
        </InfoCard>

        <InfoCard icon={Mail} label='Email'>
          <Link
            href={`mailto:${settings.email}`}
            className={`${BODY_TEXT} w-fit max-w-full rounded-sm break-all transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:outline-none`}
          >
            {settings.email}
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
