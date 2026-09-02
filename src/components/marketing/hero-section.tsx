import Image from 'next/image';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className='relative flex min-h-[600px] items-center overflow-hidden px-6 pt-32 pb-24 sm:px-12 lg:min-h-[790px] lg:pt-40 lg:pb-40'>
      <div className='absolute inset-0 z-0'>
        <Image
          src='/assets/marketing/hero.jpg'
          alt='Restored sports car in the Vantage Autobody workshop'
          fill
          priority
          className='object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-r from-[rgba(19,19,19,0.9)] via-[rgba(19,19,19,0.6)] via-50% to-[rgba(19,19,19,0)]' />
        <div className='absolute inset-0 bg-gradient-to-t from-[#131313] to-transparent opacity-80' />
      </div>

      <div className='relative z-10 flex max-w-[768px] flex-col gap-8'>
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-4'>
            <span className='h-px w-12 bg-[#ffb4ab]/50' />
            <span className='text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase'>
              Precision Engineering &amp; Restoration
            </span>
          </div>

          <h1 className='font-[family-name:var(--font-manrope)] text-5xl leading-[1.1] font-extrabold tracking-[-1.28px] text-[#e5e2e1] uppercase lg:text-[64px] lg:leading-[72px]'>
            We Restore
            <br />
            Your Car
            <br />
            <span className='text-[#ffb4ab]'>To Its Best.</span>
          </h1>

          <p className='max-w-[576px] text-lg leading-7 text-[#e6bdb8]'>
            Professional crash repair, structural bodywork, precision paint, and high-end vehicle restoration in
            Ireland. Your vehicle, our obsession.
          </p>
        </div>

        <div className='flex flex-wrap gap-4 pt-4'>
          <Link
            href='/get-a-quote'
            className='bg-[#ffb4ab] px-8 py-4 text-xs font-bold tracking-[1.2px] text-[#690005] uppercase shadow-[0px_10px_15px_-3px_rgba(255,180,171,0.2),0px_4px_6px_-4px_rgba(255,180,171,0.2)] transition-opacity hover:opacity-90'
          >
            Get a Free Quote
          </Link>
          <Link
            href='#our-work'
            className='border border-white/20 px-8 py-4 text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase transition-colors hover:bg-white/5'
          >
            View Our Work
          </Link>
        </div>
      </div>
    </section>
  );
}
