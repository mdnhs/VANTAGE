import Image from 'next/image';
import { cldUrl } from '@/lib/cloudinary/url';
import type { ProjectPublic } from '@/features/projects/types';

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-100', 'motion-delay-200', 'motion-delay-300'];
// Cycled through so any number of admin-entered projects still gets a varied masonry rhythm
// instead of every card collapsing to the same aspect ratio.
const ASPECTS = ['aspect-[4/3]', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-video'];

function ProjectCard({ project, delayClass, aspect }: { project: ProjectPublic; delayClass: string; aspect: string }) {
  const afterUrl = cldUrl(project.afterImagePublicId, { width: 900, crop: 'fill' });
  const beforeUrl = cldUrl(project.beforeImagePublicId, { width: 900, crop: 'fill' });

  return (
    <div className={`group intersect-once flex flex-col gap-4 intersect:motion-preset-slide-up ${delayClass}`}>
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-[#201f1f] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:-translate-y-1 ${aspect}`}
      >
        <Image
          src={afterUrl}
          alt={`${project.title} — after restoration`}
          fill
          className='object-cover opacity-100 transition-opacity duration-300 group-hover:opacity-0'
        />
        <Image
          src={beforeUrl}
          alt={`${project.title} — before restoration`}
          fill
          className='object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100'
        />

        <div className='absolute top-4 left-4'>
          <span className='bg-[#131313]/80 px-3 py-1 text-xs font-semibold tracking-[0.6px] text-[#e5e2e1] uppercase backdrop-blur-md'>
            {project.serviceCategory}
          </span>
        </div>

        <div className='absolute right-4 bottom-4 rounded-xs bg-[#dc2626]/90 px-3 py-1 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100'>
          <span className='text-xs font-bold tracking-[0.6px] text-white uppercase'>View Before State</span>
        </div>
      </div>

      <div className='flex items-start justify-between gap-4'>
        <div className='flex flex-col'>
          <h3 className='font-[family-name:var(--font-manrope)] text-xl font-semibold tracking-tight text-[#e5e2e1] uppercase sm:text-2xl'>
            {project.title}
          </h3>
          <p className='text-sm text-neutral-400 sm:text-base'>{project.vehicleModel}</p>
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

interface ProjectGridProps {
  projects: ProjectPublic[];
}

// Asymmetric 4-column masonry: even-index projects fill the left column, odd-index the
// right (offset down to stagger the rows) — generic over any project count, not just 4.
export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return <p className='text-sm text-neutral-400'>No projects published yet — check back soon.</p>;
  }

  const left = projects.filter((_, index) => index % 2 === 0);
  const right = projects.filter((_, index) => index % 2 === 1);

  return (
    <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-12'>
      <div className='flex flex-col gap-8 sm:gap-12'>
        {left.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            delayClass={STAGGER_DELAY[i % STAGGER_DELAY.length]}
            aspect={ASPECTS[i % ASPECTS.length]}
          />
        ))}
      </div>
      <div className='flex flex-col gap-8 sm:gap-12 sm:pt-16'>
        {right.map((project, i) => (
          <div key={project.id} className={i === right.length - 1 && right.length > 1 ? 'sm:-mt-12' : undefined}>
            <ProjectCard
              project={project}
              delayClass={STAGGER_DELAY[(i + 1) % STAGGER_DELAY.length]}
              aspect={ASPECTS[(i + 2) % ASPECTS.length]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
