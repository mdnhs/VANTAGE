interface TimelineStep {
  label: string;
  description: string;
}

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = [
  'motion-delay-0',
  'motion-delay-75',
  'motion-delay-150',
  'motion-delay-225',
  'motion-delay-300',
  'motion-delay-375',
  'motion-delay-450',
];

function Step({ step, number, delayClass }: { step: TimelineStep; number: string; delayClass: string }) {
  return (
    <div className={`group intersect-once flex flex-col gap-4 intersect:motion-preset-slide-up ${delayClass}`}>
      <span className='relative z-10 flex size-12 items-center justify-center rounded-full bg-[#131313] font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1] ring-2 ring-[#2a2a2a] transition-all duration-300 group-hover:motion-preset-pop group-hover:text-red-500 group-hover:ring-red-500/50'>
        {number}
      </span>
      <div className='flex flex-col gap-1'>
        <span className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>{step.label}</span>
        <p className='text-sm leading-5 text-neutral-400'>{step.description}</p>
      </div>
    </div>
  );
}

interface ProcessTimelineProps {
  eyebrow: string;
  title: string;
  steps: TimelineStep[];
}

export function ProcessTimeline({ eyebrow, title, steps }: ProcessTimelineProps) {
  return (
    <section className='container mx-auto flex flex-col gap-12 px-4 py-16 sm:gap-16 sm:px-6 sm:py-20 lg:gap-20 lg:px-12 lg:py-[120px]'>
      <div className='intersect-once flex flex-col items-center gap-3 text-center sm:gap-4 intersect:motion-preset-slide-up-sm'>
        <span className='text-xs font-semibold tracking-[1.2px] text-red-500 uppercase'>{eyebrow}</span>
        <h2 className='font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[#e5e2e1] uppercase sm:text-3xl lg:text-[40px] lg:leading-[48px]'>
          {title}
        </h2>
      </div>

      <div className='xs:grid-cols-2 relative grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-x-8 sm:gap-y-12'>
        <div className='pointer-events-none absolute top-6 right-0 left-0 hidden h-px bg-[#2a2a2a] sm:block' />
        {steps.map((step, index) => (
          <Step
            key={`${step.label}-${index}`}
            step={step}
            number={String(index + 1).padStart(2, '0')}
            delayClass={STAGGER_DELAY[index % STAGGER_DELAY.length]}
          />
        ))}
      </div>
    </section>
  );
}
