export function QuoteHero() {
  return (
    <div className='flex flex-col gap-2 pt-4 pb-8'>
      <span className='mb-2 block h-1 w-12 bg-[#dc2626]' />

      <h1 className='xs:text-4xl max-w-[768px] font-[family-name:var(--font-manrope)] text-3xl leading-tight font-extrabold tracking-tight text-[#e5e2e1] uppercase sm:text-5xl sm:leading-[1.1] lg:text-[64px] lg:leading-[72px] lg:tracking-[-3.2px]'>
        Get Your Repair
        <br />
        Quote.
      </h1>

      <p className='max-w-[672px] pt-2 text-base leading-relaxed text-neutral-300 sm:text-lg sm:leading-7'>
        Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation
        estimate from our master technicians.
      </p>
    </div>
  );
}
