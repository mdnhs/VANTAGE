import Image from 'next/image';

interface ServicesHeroProps {
  eyebrow: string;
  headlineLine1: string;
  headlineAccent: string;
  subtext: string;
}

export function ServicesHero({ eyebrow, headlineLine1, headlineAccent, subtext }: ServicesHeroProps) {
  return (
    <section className='relative container mx-auto flex min-h-[360px] items-center justify-center overflow-hidden px-4 pt-28 pb-14 sm:min-h-[420px] sm:px-6 sm:pt-32 sm:pb-16 md:px-12 lg:min-h-[534px]'>
      <div className='absolute inset-0 -z-10'>
        <Image
          src='/assets/marketing/services-hero.jpg'
          alt='Vantage Autobody workshop'
          fill
          priority
          className='object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-b from-[rgba(19,19,19,0.9)] via-[rgba(19,19,19,0.6)] via-50% to-[#131313]' />
      </div>

      <div className='flex max-w-[1280px] motion-preset-slide-up flex-col items-center gap-4 text-center motion-duration-700 sm:gap-6'>
        <span className='text-xs font-semibold tracking-[2.4px] text-[#dc2626] uppercase'>{eyebrow}</span>

        <h1 className='xs:text-4xl max-w-[896px] font-[family-name:var(--font-manrope)] text-3xl leading-tight font-extrabold tracking-tight text-[#e5e2e1] uppercase drop-shadow-[0px_25px_12.5px_rgba(0,0,0,0.15)] sm:text-5xl sm:leading-[1.1] lg:text-[64px] lg:leading-[72px]'>
          {headlineLine1}
          <br />
          <span className='text-[#dc2626]'>{headlineAccent}</span>
        </h1>

        <p className='max-w-[672px] text-base leading-relaxed text-neutral-300 sm:text-lg sm:leading-7'>{subtext}</p>
      </div>
    </section>
  );
}
