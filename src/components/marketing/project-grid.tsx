import Image from 'next/image';

type Project = {
  title: string;
  subtitle: string;
  badge: string;
  after: string;
  before: string;
  aspect: string;
};

const PROJECTS: Project[] = [
  {
    title: 'BMW 3 Series',
    subtitle: 'Extensive Rear Quarter Panel Reconstruction',
    badge: 'Crash Repair',
    after: '/assets/marketing/project-bmw-3-series-after.jpg',
    before: '/assets/marketing/project-bmw-3-series-before.jpg',
    aspect: 'aspect-[4/3]',
  },
  {
    title: 'Porsche 911 Carrera',
    subtitle: 'Bare Metal Respray & Preservation',
    badge: 'Full Respray',
    after: '/assets/marketing/project-porsche-911-after.jpg',
    before: '/assets/marketing/project-porsche-911-before.jpg',
    aspect: 'aspect-[3/4]',
  },
  {
    title: 'Audi RS6 Avant',
    subtitle: 'Multi-stage Correction & Ceramic Coat',
    badge: 'Paint Correction',
    after: '/assets/marketing/project-audi-rs6-after.jpg',
    before: '/assets/marketing/project-audi-rs6-before.jpg',
    aspect: 'aspect-[4/5]',
  },
  {
    title: 'Defender 110',
    subtitle: 'Widebody Conversion & Matte Finish',
    badge: 'Custom Fabrication',
    after: '/assets/marketing/project-defender-after.jpg',
    before: '/assets/marketing/project-defender-before.jpg',
    aspect: 'aspect-video',
  },
];

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-100', 'motion-delay-200', 'motion-delay-300'];

function ProjectCard({ project, delayClass }: { project: Project; delayClass: string }) {
  return (
    <div className={`group intersect-once flex flex-col gap-4 intersect:motion-preset-slide-up ${delayClass}`}>
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-[#201f1f] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:-translate-y-1 ${project.aspect}`}
      >
        <Image
          src={project.after}
          alt={`${project.title} — after restoration`}
          fill
          className='object-cover opacity-100 transition-opacity duration-300 group-hover:opacity-0'
        />
        <Image
          src={project.before}
          alt={`${project.title} — before restoration`}
          fill
          className='object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100'
        />

        <div className='absolute top-4 left-4'>
          <span className='bg-[#131313]/80 px-3 py-1 text-xs font-semibold tracking-[0.6px] text-[#e5e2e1] uppercase backdrop-blur-md'>
            {project.badge}
          </span>
        </div>

        <div className='absolute right-4 bottom-4 bg-[#ffb4ab]/90 px-3 py-1 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100'>
          <span className='text-xs font-semibold tracking-[0.6px] text-[#690005] uppercase'>View Before State</span>
        </div>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <div className='flex flex-col'>
          <h3 className='font-[family-name:var(--font-manrope)] text-2xl font-semibold tracking-[-0.6px] text-[#e5e2e1] uppercase'>
            {project.title}
          </h3>
          <p className='text-base text-[#e6bdb8]'>{project.subtitle}</p>
        </div>
        <Image
          src='/assets/marketing/icon-project-link.svg'
          alt=''
          width={13}
          height={13}
          className='mt-2 size-[13px] shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1'
        />
      </div>
    </div>
  );
}

export function ProjectGrid() {
  return (
    <div className='grid grid-cols-1 gap-12 sm:grid-cols-2'>
      <div className='flex flex-col gap-12'>
        <ProjectCard project={PROJECTS[0]} delayClass={STAGGER_DELAY[0]} />
        <ProjectCard project={PROJECTS[2]} delayClass={STAGGER_DELAY[2]} />
      </div>
      <div className='flex flex-col gap-12 sm:pt-16'>
        <ProjectCard project={PROJECTS[1]} delayClass={STAGGER_DELAY[1]} />
        <div className='sm:-mt-12'>
          <ProjectCard project={PROJECTS[3]} delayClass={STAGGER_DELAY[3]} />
        </div>
      </div>
    </div>
  );
}
