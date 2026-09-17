import { Compass, Flame, ShieldCheck, Timer } from 'lucide-react';

const PILLARS = [
  {
    step: 'Pillar 01',
    title: 'OEM Laser Jigging',
    description: 'Celette bench chassis pulling calibrated to factory millimeter tolerances.',
    icon: Compass,
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
    icon: ShieldCheck,
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
    <section className='relative z-20 mx-auto -mt-10 w-full max-w-[1280px] px-4 sm:px-6 lg:px-8'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.step}
              className='flex flex-col gap-2 rounded-lg border border-white/10 bg-[#161616]/95 p-5 backdrop-blur-md transition-all hover:border-[#dc2626]/50 hover:shadow-[0_8px_30px_rgba(220,38,38,0.12)]'
            >
              <div className='flex items-center justify-between'>
                <Icon className='size-6 text-[#dc2626]' />
                <span className='font-mono text-[10px] text-neutral-500 uppercase'>{pillar.step}</span>
              </div>
              <h3 className='mt-1 text-sm font-bold tracking-wider text-white uppercase'>{pillar.title}</h3>
              <p className='text-xs leading-relaxed text-neutral-400'>{pillar.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
