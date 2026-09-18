import Image from 'next/image';
import { Calculator, ArrowRight, Image as ImageIcon } from 'lucide-react';

const TRUST_STATS = [
  {
    number: '25+ Years',
    label: 'Dublin Workshop Since 1998',
  },
  {
    number: '12,000+',
    label: 'Accident Vehicles Restored',
  },
  {
    number: '100%',
    label: 'Direct Insurance Billing',
  },
  {
    number: 'Lifetime',
    label: 'Paint & Workmanship Guarantee',
  },
];

export function StitchHero() {
  return (
    <section className='relative flex min-h-[760px] w-full items-center justify-center overflow-hidden border-b border-white/10 lg:min-h-[820px]'>
      {/* Background Image */}
      <div className='absolute inset-0 z-0'>
        <Image
          src='/assets/marketing/stitch-hero.jpg'
          alt='Vantage Autobody Dublin precision workshop'
          fill
          priority
          className='object-cover brightness-95 contrast-125'
        />
        {/* Vignette Gradients */}
        <div className='absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/85 to-transparent' />
        <div className='absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/40 to-transparent' />
        <div className='absolute inset-0 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:28px_28px] opacity-10' />
      </div>

      <div className='relative z-10 mx-auto flex w-full max-w-[1280px] flex-col justify-center px-4 py-20 sm:px-6 lg:px-8'>
        <div className='flex max-w-3xl flex-col gap-6'>
          {/* Eyebrow Badge */}
          <div className='inline-flex w-fit items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 backdrop-blur-md'>
            <span className='size-2 animate-pulse rounded-full bg-[#dc2626] shadow-[0_0_8px_#dc2626]' />
            <span className='font-mono text-[11px] tracking-widest text-neutral-300 uppercase'>
              Ireland&apos;s Premier Collision &amp; Respray Specialists
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className='font-[family-name:var(--font-manrope)] text-4xl font-extrabold tracking-tight text-white uppercase sm:text-5xl lg:text-[60px] lg:leading-[68px]'>
            We Restore <br />
            Your Car <br />
            <span className='bg-gradient-to-r from-red-500 via-[#dc2626] to-white bg-clip-text text-transparent'>
              To Its Best.
            </span>
          </h1>

          {/* Subtext */}
          <p className='max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg'>
            Manufacturer-standard accident repair, computerized laser chassis realignment, certified spray painting, and
            bespoke automotive restoration in Dublin. Your vehicle, our obsession.
          </p>

          {/* CTAs */}
          <div className='flex flex-wrap items-center gap-4 pt-2'>
            <a
              href='#estimator'
              className='group relative flex items-center gap-3 overflow-hidden rounded bg-[#dc2626] px-8 py-4 text-sm font-bold tracking-widest text-white uppercase shadow-lg shadow-red-900/40 transition-all hover:bg-red-700'
            >
              <Calculator className='size-5' />
              <span>Get a Free Estimate</span>
              <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
            </a>

            <a
              href='#work'
              className='flex items-center gap-2.5 rounded border border-white/15 bg-white/[0.04] px-8 py-4 text-sm font-semibold tracking-widest text-white uppercase backdrop-blur-sm transition-all hover:border-[#dc2626] hover:bg-white/10'
            >
              <ImageIcon className='size-4 text-neutral-400' />
              <span>View Our Work</span>
            </a>
          </div>

          {/* Trust Ticker */}
          <div className='mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 md:grid-cols-4'>
            {TRUST_STATS.map((stat) => (
              <div key={stat.number} className='flex flex-col gap-1'>
                <span className='font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl'>
                  {stat.number}
                </span>
                <span className='text-xs text-neutral-400'>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
