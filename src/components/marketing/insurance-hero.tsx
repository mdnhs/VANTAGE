import Image from 'next/image';
import Link from 'next/link';

interface InsuranceHeroProps {
  eyebrow: string;
  line1: string;
  line2: string;
  line3: string;
  subtext: string;
}

export function InsuranceHero({ eyebrow, line1, line2, line3, subtext }: InsuranceHeroProps) {
  return (
    <section className='container mx-auto grid grid-cols-1 items-center gap-10 px-4 pt-12 pb-16 sm:gap-12 sm:px-6 sm:pt-16 sm:pb-20 lg:grid-cols-2 lg:gap-24 lg:px-12 lg:pb-[120px]'>
      <div className='flex motion-preset-slide-up flex-col gap-5 motion-duration-700 sm:gap-6'>
        <span className='text-xs font-semibold tracking-[1.2px] text-red-500 uppercase'>{eyebrow}</span>

        <h1 className='xs:text-4xl font-[family-name:var(--font-manrope)] text-3xl leading-tight font-extrabold tracking-tight text-[#e5e2e1] uppercase sm:text-5xl sm:leading-[1.1] lg:text-[64px] lg:tracking-[-3.2px]'>
          {line1}
          <br />
          <span className='text-[#dc2626]'>{line2}</span>
          <br />
          <span className='text-white'>{line3}</span>
        </h1>

        <p className='max-w-[512px] text-base leading-relaxed text-neutral-300 sm:text-lg sm:leading-7'>{subtext}</p>

        <Link
          href='/get-a-quote'
          className='flex w-full items-center justify-center rounded bg-[#dc2626] px-8 py-4 text-xs font-bold tracking-[1.2px] text-white uppercase shadow-[0_4px_20px_rgba(220,38,38,0.35)] transition-all hover:-translate-y-1 hover:bg-red-700 sm:w-fit'
        >
          Talk to a Specialist
        </Link>
      </div>

      <div className='relative motion-preset-slide-left motion-delay-150 motion-duration-700'>
        <div className='pointer-events-none absolute -bottom-8 -left-8 size-48 rounded-full bg-red-600/10 blur-[32px]' />
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
