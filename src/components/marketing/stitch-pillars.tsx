import {
  Factory,
  Flame,
  Headset,
  Timer,
  Wrench,
  Shield,
  Star,
  Clock,
  Car,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

// Keys must match the `icon` column values written by the Homepage Pillars admin form
// (src/validations/homepage-pillar-schema.ts → HOMEPAGE_PILLAR_ICONS).
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-100', 'motion-delay-200', 'motion-delay-300'];

const ICONS: Record<string, LucideIcon> = {
  factory: Factory,
  flame: Flame,
  headset: Headset,
  timer: Timer,
  wrench: Wrench,
  shield: Shield,
  star: Star,
  clock: Clock,
  car: Car,
  sparkles: Sparkles,
};

interface Pillar {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface StitchPillarsProps {
  pillars: Pillar[];
}

// Content is CMS-driven (Dashboard → Homepage Pillars) — display order and enabled state are
// controlled there, this component just renders whatever it's given.
export function StitchPillars({ pillars }: StitchPillarsProps) {
  if (pillars.length === 0) return null;

  return (
    <section className='relative z-20 container mx-auto -mt-10 px-6 sm:px-12'>
      <div className='intersect-once grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-[#141414] p-3 shadow-2xl backdrop-blur-2xl sm:grid-cols-2 lg:grid-cols-4 intersect:motion-preset-fade'>
        {pillars.map((pillar, index) => {
          const Icon = ICONS[pillar.icon] ?? Factory;
          return (
            <div
              key={pillar.id}
              className={`intersect-once flex flex-col gap-2 rounded-lg border border-white/5 bg-[#1c1b1b]/90 p-5 transition-all hover:border-[#dc2626]/40 intersect:motion-preset-slide-up-sm ${STAGGER_DELAY[index % STAGGER_DELAY.length]}`}
            >
              <div className='flex items-center justify-between'>
                <Icon className='size-6 text-[#dc2626]' />
                <span className='font-mono text-[10px] text-neutral-500 uppercase'>
                  Pillar {String(index + 1).padStart(2, '0')}
                </span>
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
