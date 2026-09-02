export function QuoteHero() {
  return (
    <div className='flex flex-col gap-2 pt-4 pb-8'>
      <span className='mb-2 block h-1 w-12 bg-[#ffb4ab]' />

      <h1 className='max-w-[768px] font-[family-name:var(--font-manrope)] text-5xl leading-[1.1] font-extrabold tracking-[-1.6px] text-[#e5e2e1] uppercase lg:text-[64px] lg:leading-[72px] lg:tracking-[-3.2px]'>
        Get Your Repair
        <br />
        Quote.
      </h1>

      <p className='max-w-[672px] pt-2 text-lg leading-7 text-[#e6bdb8]'>
        Precision assessment starts here. Provide your vehicle details and images for an accurate, no-obligation
        estimate from our master technicians.
      </p>
    </div>
  );
}
