import Image from 'next/image';

export function ServicesHero() {
  return (
    <section className='relative flex min-h-[420px] items-center justify-center overflow-hidden px-6 pt-20 pb-16 sm:px-12 lg:min-h-[534px]'>
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

      <div className='flex max-w-[1280px] motion-preset-slide-up flex-col items-center gap-6 text-center motion-duration-700'>
        <span className='text-xs font-semibold tracking-[2.4px] text-[#ffb4ab] uppercase'>Master Craftsmanship</span>

        <h1 className='max-w-[896px] font-[family-name:var(--font-manrope)] text-5xl leading-[1.1] font-extrabold tracking-[-1.28px] text-[#e5e2e1] uppercase drop-shadow-[0px_25px_12.5px_rgba(0,0,0,0.15)] lg:text-[64px] lg:leading-[72px]'>
          Professional Bodywork.
          <br />
          <span className='bg-gradient-to-r from-[#e5e2e1] via-[#ffb4ab] to-[#e5e2e1] bg-clip-text text-transparent'>
            Precision Finish.
          </span>
        </h1>

        <p className='max-w-[672px] text-lg leading-7 text-[#e6bdb8]'>
          Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond
          original specifications.
        </p>
      </div>
    </section>
  );
}
