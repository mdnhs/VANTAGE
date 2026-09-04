import Image from 'next/image';

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150', 'motion-delay-300'];

const TEAM = [
  { name: "Declan O'Rourke", role: 'Master Technician', photo: '/assets/marketing/profile.jpg' },
  { name: 'Siobhan Gallagher', role: 'Lead Refinisher', photo: '/assets/marketing/about-team-siobhan.jpg' },
  { name: 'Liam Murphy', role: 'Diagnostics & Calibration', photo: '/assets/marketing/about-team-liam.jpg' },
];

export function TeamSection() {
  return (
    <section className='relative overflow-hidden bg-[#1c1b1b] px-6 py-20 sm:px-12 lg:py-[120px]'>
      <div className='pointer-events-none absolute inset-y-0 right-0 left-1/2 bg-gradient-to-l from-[rgba(255,180,171,0.05)] to-transparent' />

      <div className='relative flex flex-col gap-16'>
        <div className='intersect-once flex flex-col gap-4 intersect:motion-preset-slide-up-sm'>
          <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-[-0.4px] text-[#e5e2e1] uppercase lg:text-[40px] lg:leading-[48px]'>
            The Precision Team
          </h2>
          <p className='max-w-[672px] text-base leading-6 text-[#e6bdb8]'>
            Our facility is only as good as the hands that operate it. We employ master technicians, ATA-accredited
            painters, and certified chassis alignment specialists.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
          {TEAM.map((member, index) => (
            <div
              key={member.name}
              className={`group intersect-once relative h-[473px] overflow-hidden rounded-lg bg-[#131313] shadow-md intersect:motion-preset-slide-up ${STAGGER_DELAY[index]}`}
            >
              <Image
                src={member.photo}
                alt={member.name}
                fill
                className='object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-[rgba(53,53,52,0.9)] via-transparent via-50% to-transparent' />
              <div className='absolute inset-x-6 bottom-6 flex flex-col gap-1'>
                <span className='font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1]'>
                  {member.name}
                </span>
                <span className='text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase'>{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
