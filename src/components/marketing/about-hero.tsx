import Image from 'next/image';

export function AboutHero() {
  return (
    <section className='relative flex min-h-[400px] items-end overflow-hidden px-6 pt-20 pb-16 sm:px-12 lg:min-h-[480px]'>
      <div className='absolute inset-0 z-0'>
        <Image
          src='/assets/marketing/about-hero.jpg'
          alt='Vantage Autobody workshop'
          fill
          priority
          className='object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-[#131313] via-[rgba(19,19,19,0.8)] via-50% to-transparent' />
      </div>

      <div className='relative z-10 flex flex-col gap-6'>
        <div className='flex items-center gap-4 opacity-80'>
          <span className='h-px w-12 bg-[#ffb4ab]' />
          <span className='text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase'>
            About Vantage Autobody
          </span>
        </div>

        <h1 className='max-w-[896px] font-[family-name:var(--font-manrope)] text-5xl leading-[1.25] font-extrabold tracking-[-1.28px] text-[#e5e2e1] lg:text-[64px] lg:leading-[80px]'>
          Built on <span className='text-[#ffb4ab]'>Craft</span>.
          <br />
          Driven by <span className='text-[#c4c7ca]'>Quality</span>.
        </h1>
      </div>
    </section>
  );
}
