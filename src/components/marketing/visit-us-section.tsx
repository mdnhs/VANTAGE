import Image from 'next/image';

export function VisitUsSection() {
  return (
    <div className='relative h-[400px] w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] lg:h-[500px]'>
      <Image
        src='/assets/marketing/contact-map.png'
        alt='Map showing Vantage Autobody location'
        fill
        className='object-cover'
      />

      <div className='absolute bottom-6 left-6 flex flex-col gap-2 rounded-xl border border-white/10 bg-[#131313]/90 p-6 shadow-lg backdrop-blur-md'>
        <span className='font-[family-name:var(--font-manrope)] text-2xl font-semibold tracking-[-0.6px] text-[#e5e2e1] uppercase'>
          Visit Us
        </span>
        <div className='flex items-center gap-2'>
          <Image src='/assets/marketing/icon-visit-clock.svg' alt='' width={12} height={12} className='size-3' />
          <span className='text-base text-[#e6bdb8]'>Mon-Fri: 08:00 - 18:00</span>
        </div>
        <div className='flex items-center gap-2'>
          <Image src='/assets/marketing/icon-visit-pin.svg' alt='' width={11} height={12} className='h-3 w-[11px]' />
          <span className='text-base text-[#e6bdb8]'>Sat-Sun: Closed</span>
        </div>
      </div>
    </div>
  );
}
