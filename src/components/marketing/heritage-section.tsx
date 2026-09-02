import Image from 'next/image';

export function HeritageSection() {
  return (
    <section className='grid grid-cols-1 gap-8 px-6 py-20 sm:px-12 lg:grid-cols-12 lg:gap-6 lg:py-[120px]'>
      <div className='flex flex-col gap-8 lg:col-span-5'>
        <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-[-0.4px] text-[#e5e2e1] uppercase lg:text-[40px] lg:leading-[48px]'>
          Our Heritage
        </h2>

        <p className='text-lg leading-[1.625] text-[#e6bdb8]'>
          Founded in 1998, Vantage Autobody began with a singular obsession: to elevate automotive repair from a trade
          to a precision craft. What started as a modest two-bay garage specializing in classic restorations has evolved
          into Ireland&apos;s premier high-end collision and repair facility.
        </p>

        <div className='flex gap-12 pt-2'>
          <div className='flex flex-col gap-2'>
            <span className='font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-[-0.4px] text-[#ffb4ab]'>
              1998
            </span>
            <span className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>Est.</span>
          </div>
          <div className='flex flex-col gap-2'>
            <span className='font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-[-0.4px] text-[#c4c7ca]'>
              25+
            </span>
            <span className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>Years of Precision</span>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-6 pt-14 lg:col-span-6 lg:col-start-7'>
        <div className='relative h-[500px] w-full overflow-hidden rounded-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]'>
          <Image
            src='/assets/marketing/about-heritage.jpg'
            alt='Craftsman working on vehicle bodywork'
            fill
            className='object-cover'
          />
        </div>

        <div className='relative mx-8 -mt-20 flex flex-col gap-4 rounded-xl bg-[#2a2a2a]/40 p-8 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] backdrop-blur-md'>
          <Image src='/assets/marketing/icon-quote.svg' alt='' width={30} height={32} className='h-8 w-[30px]' />
          <p className='text-base leading-6 text-[#e6bdb8] italic'>
            &quot;We don&apos;t just fix cars; we restore the engineering integrity and aesthetic perfection of every
            vehicle that crosses our threshold.&quot;
          </p>
        </div>
      </div>
    </section>
  );
}
