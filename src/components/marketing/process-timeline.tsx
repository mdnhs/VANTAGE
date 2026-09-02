const STEPS = [
  {
    number: '01',
    label: 'Report',
    description: 'Drop off your vehicle or let us recover it securely to our facility.',
  },
  {
    number: '02',
    label: 'Insurer Contact',
    description: 'We open the dialogue with your provider to establish the claim.',
  },
  {
    number: '03',
    label: 'Assessment',
    description: '3D laser scanning and structural diagnostics form a complete blueprint.',
  },
  {
    number: '04',
    label: 'Approval',
    description: 'Technical justification secures rapid, uncompromised authorization.',
  },
  {
    number: '05',
    label: 'Repair',
    description: 'Our master technicians execute precision bodywork and flawless respraying.',
  },
  {
    number: '06',
    label: 'Quality Control',
    description: 'Micron-level paint depth checks and strict safety calibrations.',
  },
  { number: '07', label: 'Return', description: 'Vehicle handed back fully valeted, certified, and guaranteed.' },
];

function Step({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <div className='flex flex-col gap-4'>
      <span className='relative z-10 flex size-12 items-center justify-center rounded-full bg-[#131313] font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1] ring-2 ring-[#2a2a2a]'>
        {step.number}
      </span>
      <div className='flex flex-col gap-1'>
        <span className='text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase'>{step.label}</span>
        <p className='text-sm leading-5 text-[#e6bdb8]'>{step.description}</p>
      </div>
    </div>
  );
}

export function ProcessTimeline() {
  return (
    <section className='flex flex-col gap-20 px-6 py-20 sm:px-12 lg:py-[120px]'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <span className='text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase'>The Methodology</span>
        <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-[-0.4px] text-[#e5e2e1] uppercase lg:text-[40px] lg:leading-[48px]'>
          7 Steps to Perfection
        </h2>
      </div>

      <div className='relative grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4'>
        <div className='pointer-events-none absolute top-6 right-0 left-0 hidden h-px bg-[#2a2a2a] sm:block' />
        {STEPS.map((step) => (
          <Step key={step.number} step={step} />
        ))}
      </div>
    </section>
  );
}
