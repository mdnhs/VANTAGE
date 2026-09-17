import Link from 'next/link';
import {
  Car,
  Sparkles,
  Paintbrush,
  Palette,
  Wand2,
  Wrench,
  Disc,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';

const SERVICES = [
  {
    title: 'Crash & Collision Repair',
    badge: 'OEM Certified',
    description: 'Major accident reconstruction, hydraulic bench pull, and laser structural chassis realignment.',
    footerTag: 'Insurance Approved',
    icon: Car,
  },
  {
    title: 'Dent Repair & PDR',
    badge: 'Same Day PDR',
    description: 'Paintless dent removal for parking dings and creases preserving factory original paint integrity.',
    footerTag: 'Zero Filler Used',
    icon: Sparkles,
  },
  {
    title: 'Precision Spray Painting',
    badge: 'Spectral Match',
    description:
      'Computerized spectrophotometer color scanning, multi-stage pearls, metallic lacquers and infrared curing.',
    footerTag: '100% Match Guarantee',
    icon: Paintbrush,
  },
  {
    title: 'Full Vehicle Resprays',
    badge: 'Concours Grade',
    description: 'Complete bare-metal strip downs, glass-out color changes, matte transitions and bespoke finishes.',
    footerTag: 'Bespoke & Classic',
    icon: Palette,
  },
  {
    title: 'Scratch & Scuff Correction',
    badge: 'SMART Repair',
    description: 'Targeted bumper corner scuffs, vandal key scratches, and localized high-blend micro-repairs.',
    footerTag: 'Express Turnaround',
    icon: Wand2,
  },
  {
    title: 'Panel Replacement',
    badge: 'Genuine Parts',
    description: 'Original quarter panels, bonnets, wings, door skins and spot-welding according to factory bulletins.',
    footerTag: 'Factory Tolerance',
    icon: Wrench,
  },
  {
    title: 'Alloy Wheel Refurbishment',
    badge: 'CNC Lathe',
    description: 'Diamond-cut CNC resurfacing, severe kerb rash weld repairs, straightening, and powder coating.',
    footerTag: 'All Wheel Sizes',
    icon: Disc,
  },
  {
    title: 'Ceramic Coating & Detailing',
    badge: 'Gtechniq Accredited',
    description:
      'Multi-stage machine paint de-swirling, ultra-hard 9H ceramic hydrophobic sealants, and leather rejuvenation.',
    footerTag: 'Up to 7 Year Protection',
    icon: ShieldCheck,
  },
];

export function StitchServices() {
  return (
    <section id='services' className='mx-auto w-full max-w-[1280px] px-4 py-24 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <span className='flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-[#dc2626] uppercase'>
            <span className='h-px w-6 bg-[#dc2626]' />
            Specialist Autobody Divisions
          </span>
          <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl lg:text-[36px] lg:leading-[44px]'>
            From Damage To <br />
            <span className='text-[#dc2626]'>Showroom Finish.</span>
          </h2>
          <p className='text-sm text-neutral-400'>
            Comprehensive automotive bodywork, structural restoration, and cosmetic refinement using factory-approved
            techniques.
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Link
            href='/services'
            className='flex items-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs tracking-widest text-neutral-300 uppercase transition-all hover:border-[#dc2626] hover:text-white'
          >
            <span>Browse Full Catalog</span>
            <ArrowUpRight className='size-3.5' />
          </Link>
        </div>
      </div>

      {/* 8 Services Grid */}
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.title}
              className='group relative flex flex-col justify-between rounded-lg border border-white/10 bg-[#161616] p-6 transition-all duration-300 hover:border-[#dc2626]/60 hover:shadow-[0_8px_30px_rgba(220,38,38,0.15)]'
            >
              <div>
                <div className='mb-5 flex items-center justify-between'>
                  <div className='flex size-12 items-center justify-center rounded-md bg-[#222222] text-[#dc2626] transition-all group-hover:scale-105 group-hover:bg-[#dc2626] group-hover:text-white'>
                    <Icon className='size-6' />
                  </div>
                  <span className='rounded border border-white/5 bg-white/5 px-2 py-1 font-mono text-[10px] text-neutral-400 uppercase'>
                    {service.badge}
                  </span>
                </div>

                <h3 className='mb-2 font-[family-name:var(--font-manrope)] text-lg font-bold text-white transition-colors group-hover:text-white'>
                  {service.title}
                </h3>
                <p className='mb-4 text-xs leading-relaxed text-neutral-400'>{service.description}</p>
              </div>

              <div className='flex items-center justify-between border-t border-white/5 pt-4 text-xs'>
                <span className='font-mono text-[11px] text-neutral-500'>{service.footerTag}</span>
                <a
                  href='#estimator'
                  className='flex items-center gap-1 font-semibold text-[#dc2626] transition-transform group-hover:translate-x-1'
                >
                  Quote <ArrowRight className='size-3' />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
