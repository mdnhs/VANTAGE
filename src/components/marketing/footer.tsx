import Image from 'next/image';
import Link from 'next/link';

const SERVICES_LINKS = ['Collision Repair', 'Precision Respraying', 'Classic Restoration', 'Dent Removal'];
const COMPANY_LINKS = ['Our Process', 'Insurance Partners', 'Showcase', 'Testimonials'];
const SOCIAL_ICONS = [
  '/assets/marketing/icon-social-1.svg',
  '/assets/marketing/icon-social-2.svg',
  '/assets/marketing/icon-social-3.svg',
];

export function MarketingFooter() {
  return (
    <footer className='border-t border-white/5 bg-[#0e0e0e]'>
      <div className='flex flex-col gap-20 px-6 pt-20 pb-12 sm:px-12 lg:gap-[120px] lg:pt-[121px]'>
        <div className='grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='flex flex-col gap-6'>
            <div className='flex items-center gap-3'>
              <Image src='/assets/marketing/logo.jpg' alt='Vantage Autobody logo' width={32} height={32} />
              <span className='font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1] uppercase'>
                Vantage
              </span>
            </div>
            <p className='max-w-[320px] text-base leading-6 text-[#e6bdb8]'>
              Excellence in precision automotive restoration and high-end repair since 1998. Your vehicle, our
              obsession.
            </p>
            <div className='flex gap-4'>
              {SOCIAL_ICONS.map((icon) => (
                <Link
                  key={icon}
                  href='#'
                  className='flex size-10 items-center justify-center rounded-full bg-[#201f1f]'
                >
                  <Image src={icon} alt='' width={15} height={15} className='size-[15px]' />
                </Link>
              ))}
            </div>
          </div>

          <div className='flex flex-col gap-6'>
            <h4 className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Services</h4>
            <nav className='flex flex-col gap-3'>
              {SERVICES_LINKS.map((link) => (
                <Link key={link} href='#services' className='text-base text-[#e6bdb8] hover:text-[#e5e2e1]'>
                  {link}
                </Link>
              ))}
            </nav>
          </div>

          <div className='flex flex-col gap-6'>
            <h4 className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Company</h4>
            <nav className='flex flex-col gap-3'>
              {COMPANY_LINKS.map((link) => (
                <Link key={link} href='#about' className='text-base text-[#e6bdb8] hover:text-[#e5e2e1]'>
                  {link}
                </Link>
              ))}
            </nav>
          </div>

          <div className='flex flex-col gap-6'>
            <h4 className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>Contact</h4>
            <div className='flex flex-col gap-4'>
              <div className='flex items-start gap-3'>
                <Image
                  src='/assets/marketing/icon-location.svg'
                  alt=''
                  width={16}
                  height={20}
                  className='mt-0.5 h-5 w-4'
                />
                <span className='text-base leading-6 text-[#e6bdb8]'>
                  Unit 4, Industrial Estate,
                  <br />
                  Dublin Road, Ireland
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <Image src='/assets/marketing/icon-phone.svg' alt='' width={18} height={18} className='size-[18px]' />
                <Link href='tel:+35312345678' className='text-base text-[#e6bdb8] hover:text-[#e5e2e1]'>
                  +353 1 234 5678
                </Link>
              </div>
              <div className='flex items-center gap-3'>
                <Image src='/assets/marketing/icon-email.svg' alt='' width={20} height={16} className='h-4 w-5' />
                <Link href='mailto:info@vantageautobody.ie' className='text-base text-[#e6bdb8] hover:text-[#e5e2e1]'>
                  info@vantageautobody.ie
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row'>
          <span className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8]/50 uppercase'>
            © 2024 Vantage Autobody. Registered in Ireland.
          </span>
          <div className='flex gap-8'>
            <Link
              href='#privacy'
              className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8]/50 uppercase hover:text-[#e6bdb8]'
            >
              Privacy Policy
            </Link>
            <Link
              href='#terms'
              className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8]/50 uppercase hover:text-[#e6bdb8]'
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
