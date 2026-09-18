const STAGGER_DELAY = [
  'motion-delay-0',
  'motion-delay-100',
  'motion-delay-200',
  'motion-delay-300',
  'motion-delay-500',
];

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  isHighlighted: boolean;
}

interface StitchProcessProps {
  steps: ProcessStep[];
}

// Content is CMS-driven (Dashboard → Homepage Process Steps) — the step number shown is
// derived from display order (index + 1), not stored as a column.
export function StitchProcess({ steps }: StitchProcessProps) {
  if (steps.length === 0) return null;

  return (
    <section id='process' className='w-full border-y border-white/10 bg-[#111111] py-24'>
      <div className='container mx-auto px-6 sm:px-12'>
        {/* Header */}
        <div className='intersect-once mx-auto mb-16 max-w-2xl text-center intersect:motion-preset-slide-up'>
          <span className='font-mono text-xs tracking-[0.2em] text-[#dc2626] uppercase'>
            Predictable &amp; Certified Workflow
          </span>
          <h2 className='mt-2 font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-tight text-white uppercase lg:text-[40px] lg:leading-[48px]'>
            The {steps.length}-Step Vantage Standard
          </h2>
          <p className='mt-3 text-base leading-6 text-neutral-400'>
            From initial digital triage to strict multi-point handoff inspection, every step is transparently logged.
          </p>
        </div>

        {/* Steps Grid */}
        <div className='relative grid grid-cols-1 gap-6 md:grid-cols-5'>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`intersect-once relative flex flex-col gap-3 rounded-lg border border-white/10 bg-[#1c1b1b] p-6 intersect:motion-preset-slide-up-sm ${STAGGER_DELAY[index % STAGGER_DELAY.length]}`}
            >
              <span
                className={`font-[family-name:var(--font-manrope)] text-3xl font-extrabold ${
                  step.isHighlighted ? 'text-[#dc2626]' : 'text-neutral-700'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className='text-base font-bold tracking-wider text-white uppercase'>{step.title}</h3>
              <p className='text-sm leading-relaxed text-neutral-400'>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
