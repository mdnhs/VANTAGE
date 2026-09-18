import { Factory, Flame, Headset, Timer } from 'lucide-react';

const PILLARS = [
  {
    step: 'Pillar 01',
    title: 'Chassis Realignment',
    description: 'Celette laser jigs restore frame geometries to precise OEM factory millimeter tolerances.',
    icon: Factory,
  },
  {
    step: 'Pillar 02',
    title: 'Blowtherm Spray Booth',
    description: 'Heated downdraft climate enclosures ensure factory-spec mirror finish clear coats.',
    icon: Flame,
  },
  {
    step: 'Pillar 03',
    title: 'Insurance Concierge',
    description: 'Direct claim management with zero paperwork headaches and hassle-free excess billing.',
    icon: Headset,
  },
  {
    step: 'Pillar 04',
    title: 'Rapid Digital Quote',
    description: 'Upload accident damage photos and receive a comprehensive certified quote in under 2 hours.',
    icon: Timer,
  },
];

export function StitchPillars() {
  return (
    <section className='relative z-20 container mx-auto -mt-10 px-6 sm:px-12'>
      <div className='grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-[#141414] p-3 shadow-2xl backdrop-blur-2xl sm:grid-cols-2 lg:grid-cols-4'>
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.step}
              className='flex flex-col gap-2 rounded-lg border border-white/5 bg-[#1c1b1b]/90 p-5 transition-all hover:border-[#dc2626]/40'
            >
              <div className='flex items-center justify-between'>
                <Icon className='size-6 text-[#dc2626]' />
                <span className='font-mono text-[10px] text-neutral-500 uppercase'>{pillar.step}</span>
              </div>
              <h3 className='mt-1 text-base font-bold tracking-wider text-white uppercase'>{pillar.title}</h3>
              <p className='text-sm leading-relaxed text-neutral-400'>{pillar.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
