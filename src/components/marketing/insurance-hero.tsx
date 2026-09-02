import Image from 'next/image';
import Link from 'next/link';

export function InsuranceHero() {
  return (
    <section className='grid grid-cols-1 items-center gap-12 px-6 pt-16 pb-20 sm:px-12 lg:grid-cols-2 lg:gap-24 lg:pb-[120px]'>
      <div className='flex flex-col gap-6'>
        <span className='text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase'>Insurance Claims</span>

        <h1 className='font-[family-name:var(--font-manrope)] text-5xl leading-[1.1] font-extrabold tracking-[-1.6px] text-[#e5e2e1] uppercase lg:text-[64px] lg:tracking-[-3.2px]'>
          Accident Repair
          <br />
          <span className='text-[#e6bdb8]'>Without The</span>
          <br />
          <span className='text-[#e6bdb8]'>Headache.</span>
        </h1>

        <p className='max-w-[512px] text-lg leading-7 text-[#e6bdb8]'>
          We handle the paperwork, the assessors, and the exact precision repairs. Focus on getting back on the road
          while our dedicated specialists coordinate seamlessly with your insurance provider.
        </p>

        <Link
          href='/get-a-quote'
          className='w-fit bg-[#ffb4ab] px-8 py-4 text-xs font-semibold tracking-[1.2px] text-[#690005] uppercase shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-90'
        >
          Talk to a Specialist
        </Link>
      </div>

      <div className='relative'>
        <div className='pointer-events-none absolute -bottom-8 -left-8 size-48 rounded-full bg-[#ffb4ab]/10 blur-[32px]' />
        <div className='relative aspect-[4/5] w-full overflow-hidden rounded-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]'>
          <Image
            src='/assets/marketing/insurance-hero.jpg'
            alt='Vehicle undergoing precision repair'
            fill
            priority
            className='object-cover'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-[rgba(19,19,19,0.8)] to-transparent' />
        </div>
      </div>
    </section>
  );
}
