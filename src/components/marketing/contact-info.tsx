import Image from 'next/image';
import Link from 'next/link';
import { siteSettingsService } from '@/server/services/site-settings-service';

// Server Component — reads settings via the cached service directly, same pattern as
// footer.tsx, so headquarters address / phone / email / WhatsApp stay in sync with the
// admin-managed site settings instead of being hardcoded per-page.
export async function ContactInfo() {
  const settings = await siteSettingsService.getPublic();

  return (
    <div className='flex motion-preset-slide-up flex-col gap-8 motion-duration-700'>
      <div className='flex flex-col gap-4'>
        <h1 className='xs:text-4xl font-[family-name:var(--font-manrope)] text-3xl leading-tight font-extrabold tracking-tight text-[#e5e2e1] uppercase sm:text-5xl sm:leading-[1.1] lg:text-[64px] lg:tracking-[-3.2px]'>
          Get In
          <br />
          <span className='text-[#dc2626]'>Touch</span>
        </h1>
        <p className='max-w-[384px] text-base leading-relaxed text-neutral-300 sm:text-lg sm:leading-7'>
          We provide precise estimates based on detailed inspections. Reach out to schedule an appointment or ask
          technical questions.
        </p>
      </div>

      <div className='flex w-full max-w-[448px] flex-col gap-4 sm:gap-6'>
        <div className='flex gap-4 rounded-xl border border-white/5 bg-[#201f1f]/30 p-5 backdrop-blur-md transition-colors duration-300 hover:border-red-500/30 sm:p-6'>
          <Image
            src='/assets/marketing/icon-contact-location.svg'
            alt=''
            width={16}
            height={24}
            className='h-6 w-4 shrink-0'
          />
          <div className='flex flex-col gap-1'>
            <span className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Headquarters</span>
            <span className='text-sm leading-relaxed text-neutral-400 sm:text-base sm:leading-[1.625]'>
              {settings.address}
            </span>
          </div>
        </div>

        <div className='flex gap-4 rounded-xl border border-white/5 bg-[#201f1f]/30 p-5 backdrop-blur-md transition-colors duration-300 hover:border-red-500/30 sm:p-6'>
          <Image
            src='/assets/marketing/icon-contact-phone.svg'
            alt=''
            width={18}
            height={22}
            className='h-[22px] w-[18px] shrink-0'
          />
          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <span className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Direct Line</span>
            <Link
              href={`tel:${settings.phone.replace(/\s+/g, '')}`}
              className='truncate font-[family-name:var(--font-manrope)] text-xl font-semibold text-[#e5e2e1] hover:text-[#dc2626] sm:text-2xl'
            >
              {settings.phone}
            </Link>
            {settings.whatsappNumber && (
              <div className='mt-2 border-t border-white/10 pt-4'>
                <Link
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex w-fit items-center gap-2 rounded-full border border-[#25d366]/20 bg-[#25d366]/10 px-4 py-2 transition-all hover:scale-105 hover:bg-[#25d366]/20'
                >
                  <Image src='/assets/marketing/icon-whatsapp.svg' alt='' width={16} height={16} className='size-4' />
                  <span className='text-xs font-semibold tracking-[0.6px] text-[#c4c7ca]'>WhatsApp Us</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className='flex gap-4 rounded-xl border border-white/5 bg-[#201f1f]/30 p-6 backdrop-blur-md transition-colors duration-300 hover:border-red-500/30'>
          <Image
            src='/assets/marketing/icon-contact-email.svg'
            alt=''
            width={20}
            height={20}
            className='size-5 shrink-0'
          />
          <div className='flex flex-col gap-1'>
            <span className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Email</span>
            <Link href={`mailto:${settings.email}`} className='text-base text-neutral-400 hover:text-white'>
              {settings.email}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
