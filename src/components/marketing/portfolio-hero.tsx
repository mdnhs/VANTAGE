export function PortfolioHero() {
  return (
    <div className='flex max-w-[768px] motion-preset-slide-up flex-col gap-4 motion-duration-700'>
      <div className='flex items-center gap-4'>
        <span className='h-px w-12 bg-[#ffb4ab]' />
        <span className='text-xs font-semibold tracking-[2.4px] text-[#ffb4ab] uppercase'>Portfolio</span>
      </div>

      <h1 className='font-[family-name:var(--font-manrope)] text-5xl leading-[1.1] font-extrabold tracking-[-1.6px] text-[#e5e2e1] uppercase lg:text-[64px] lg:leading-[57.6px] lg:tracking-[-3.2px]'>
        Our Recent
        <br />
        <span className='text-[#e6bdb8]'>Restorations.</span>
      </h1>

      <p className='max-w-[576px] pt-4 text-lg leading-7 text-[#e6bdb8]'>
        Explore a curated selection of our most challenging and rewarding projects. Precision engineering meets master
        craftsmanship.
      </p>
    </div>
  );
}
