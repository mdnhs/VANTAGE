import Image from 'next/image';
import Link from 'next/link';

export function ContactInfo() {
  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-4'>
        <h1 className='font-[family-name:var(--font-manrope)] text-5xl leading-[1.1] font-extrabold tracking-[-1.6px] text-[#e5e2e1] uppercase lg:text-[64px] lg:tracking-[-3.2px]'>
          Get In
          <br />
          <span className='text-[#ffb4ab]'>Touch</span>
        </h1>
        <p className='max-w-[384px] text-lg leading-7 text-[#e6bdb8]'>
          We provide precise estimates based on detailed inspections. Reach out to schedule an appointment or ask
          technical questions.
        </p>
      </div>

      <div className='flex max-w-[448px] flex-col gap-6'>
        <div className='flex gap-4 rounded-xl border border-white/5 bg-[#201f1f]/30 p-6 backdrop-blur-md'>
          <Image
            src='/assets/marketing/icon-contact-location.svg'
            alt=''
            width={16}
            height={24}
            className='h-6 w-4 shrink-0'
          />
          <div className='flex flex-col gap-1'>
            <span className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Headquarters</span>
            <span className='text-base leading-[1.625] text-[#e6bdb8]'>
              Unit 4, Industrial Estate,
              <br />
              Dublin Road, Ireland
            </span>
          </div>
        </div>

        <div className='flex gap-4 rounded-xl border border-white/5 bg-[#201f1f]/30 p-6 backdrop-blur-md'>
          <Image
            src='/assets/marketing/icon-contact-phone.svg'
            alt=''
            width={18}
            height={22}
            className='h-[22px] w-[18px] shrink-0'
          />
          <div className='flex flex-1 flex-col gap-1'>
            <span className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Direct Line</span>
            <Link
              href='tel:+35312345678'
              className='font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1]'
            >
              +353 1 234 5678
            </Link>
            <div className='mt-2 border-t border-white/10 pt-4'>
              <Link
                href='https://wa.me/35312345678'
                target='_blank'
                rel='noopener noreferrer'
                className='flex w-fit items-center gap-2 rounded-full border border-[#25d366]/20 bg-[#25d366]/10 px-4 py-2'
              >
                <Image src='/assets/marketing/icon-whatsapp.svg' alt='' width={16} height={16} className='size-4' />
                <span className='text-xs font-semibold tracking-[0.6px] text-[#c4c7ca]'>WhatsApp Us</span>
              </Link>
            </div>
          </div>
        </div>

        <div className='flex gap-4 rounded-xl border border-white/5 bg-[#201f1f]/30 p-6 backdrop-blur-md'>
          <Image
            src='/assets/marketing/icon-contact-email.svg'
            alt=''
            width={20}
            height={20}
            className='size-5 shrink-0'
          />
          <div className='flex flex-col gap-1'>
            <span className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Email</span>
            <Link href='mailto:info@vantageautobody.ie' className='text-base text-[#e6bdb8] hover:text-[#e5e2e1]'>
              info@vantageautobody.ie
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
