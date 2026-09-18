interface PortfolioHeroProps {
  eyebrow: string;
  headlineLine1: string;
  headlineAccent: string;
  subtext: string;
}

export function PortfolioHero({ eyebrow, headlineLine1, headlineAccent, subtext }: PortfolioHeroProps) {
  return (
    <div className='flex max-w-[768px] motion-preset-slide-up flex-col gap-4 motion-duration-700'>
      <div className='flex items-center gap-4'>
        <span className='h-px w-12 bg-red-500' />
        <span className='text-xs font-semibold tracking-[2.4px] text-red-500 uppercase'>{eyebrow}</span>
      </div>

      <h1 className='xs:text-4xl font-[family-name:var(--font-manrope)] text-3xl leading-tight font-extrabold tracking-tight text-[#e5e2e1] uppercase sm:text-5xl sm:leading-[1.1] lg:text-[64px] lg:leading-[57.6px] lg:tracking-[-3.2px]'>
        {headlineLine1}
        <br />
        <span className='text-[#dc2626]'>{headlineAccent}</span>
      </h1>

      <p className='max-w-[576px] pt-2 text-base leading-relaxed text-neutral-300 sm:pt-4 sm:text-lg sm:leading-7'>
        {subtext}
      </p>
    </div>
  );
}
