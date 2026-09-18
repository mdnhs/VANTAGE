const STEPS = [
  {
    number: '01',
    title: 'Digital Assessment',
    description: 'High-definition imaging, ultrasonic thickness readings, and diagnostic computer pre-scans.',
    highlight: false,
  },
  {
    number: '02',
    title: 'Clear Estimate',
    description: 'Line-item parts, labor hours, and paint schedules provided with guaranteed cost caps.',
    highlight: false,
  },
  {
    number: '03',
    title: 'Insurer Approval',
    description: 'Direct liaison with loss adjusters and digital sign-offs to immediately trigger parts orders.',
    highlight: false,
  },
  {
    number: '04',
    title: 'Precision Repair',
    description: 'Celette jig pulling, panel welding, waterborne basecoat, and 60°C oven baking.',
    highlight: true,
  },
  {
    number: '05',
    title: 'Audit & Delivery',
    description: 'Full 42-point quality check, road test, valet sanitization, and lifetime warranty cert.',
    highlight: false,
  },
];

export function StitchProcess() {
  return (
    <section id='process' className='w-full border-y border-white/10 bg-[#111111] py-24'>
      <div className='container mx-auto px-6 sm:px-12'>
        {/* Header */}
        <div className='mx-auto mb-16 max-w-2xl text-center'>
          <span className='font-mono text-xs tracking-[0.2em] text-[#dc2626] uppercase'>
            Predictable &amp; Certified Workflow
          </span>
          <h2 className='mt-2 font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-tight text-white uppercase lg:text-[40px] lg:leading-[48px]'>
            The 5-Step Vantage Standard
          </h2>
          <p className='mt-3 text-base leading-6 text-neutral-400'>
            From initial digital triage to strict multi-point handoff inspection, every step is transparently logged.
          </p>
        </div>

        {/* 5 Steps Grid */}
        <div className='relative grid grid-cols-1 gap-6 md:grid-cols-5'>
          {STEPS.map((step) => (
            <div
              key={step.number}
              className='relative flex flex-col gap-3 rounded-lg border border-white/10 bg-[#1c1b1b] p-6'
            >
              <span
                className={`font-[family-name:var(--font-manrope)] text-3xl font-extrabold ${
                  step.highlight ? 'text-[#dc2626]' : 'text-neutral-700'
                }`}
              >
                {step.number}
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
