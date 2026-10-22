'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { sizedSrc } from '@/lib/media/public-image';
import type { ProjectPublic } from '@/features/projects/types';
import { ALL_FILTER, DEFAULT_FILTERS, PortfolioFilters } from '@/components/marketing/portfolio-filters';
import { BUTTON_SECONDARY } from '@/components/marketing/ui/landing-primitives';

const PAGE_SIZE = 9;
const dateFormatter = new Intl.DateTimeFormat('en-IE', { year: 'numeric', month: 'short' });

const normalize = (value: string) => value.trim().toLowerCase();

// Same card as the homepage Results section (stitch-case-studies.tsx): 256px photo with a
// before/after toggle, category + title + description, VEHICLE / COMPLETED meta rows.
function ProjectCard({ project }: { project: ProjectPublic }) {
  const hasBefore = Boolean(project.beforeImage);
  const [mode, setMode] = useState<'after' | 'before'>('after');
  const currentMode = hasBefore ? mode : 'after';
  const current = currentMode === 'after' ? project.afterImage : project.beforeImage;

  return (
    <article className='group flex flex-col overflow-hidden rounded-2xl border border-[#2a2a30] bg-[#1b1b20] transition-colors hover:border-[#dc2626]/50'>
      {/* Photo with Before/After toggle */}
      <div className='relative h-64 w-full shrink-0 overflow-hidden bg-black'>
        {current && (
          <Image
            src={sizedSrc(current, 'w_800,h_512,c_fill')}
            style={{ objectPosition: `${current.focal.x * 100}% ${current.focal.y * 100}%` }}
            alt={`${project.title} — ${currentMode === 'after' ? 'after' : 'before'} restoration`}
            fill
            sizes='(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw'
            className='object-cover transition-transform duration-500 group-hover:scale-105'
          />
        )}

        {hasBefore && (
          <button
            type='button'
            onClick={() => setMode((prev) => (prev === 'before' ? 'after' : 'before'))}
            aria-label={currentMode === 'after' ? 'Show before photo' : 'Show after photo'}
            className='absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-white/12 bg-[rgba(17,17,19,0.8)] px-3 py-[7px] font-[family-name:var(--font-inter)] text-[10px] leading-normal whitespace-nowrap backdrop-blur-md transition-colors hover:border-[#dc2626] focus-visible:border-[#dc2626] focus-visible:outline-none'
          >
            <span
              className={`tracking-[0.6px] ${currentMode === 'before' ? 'font-medium text-white' : 'text-[#737373]'}`}
            >
              BEFORE
            </span>
            <span className='text-[#737373]'>/</span>
            <span
              className={`tracking-[0.6px] ${currentMode === 'after' ? 'font-medium text-white' : 'text-[#737373]'}`}
            >
              AFTER
            </span>
          </button>
        )}

        <div
          className={`absolute right-3.5 bottom-4 flex items-center rounded-md border px-2.5 py-1.5 font-[family-name:var(--font-inter)] text-[10px] leading-normal tracking-[0.6px] whitespace-nowrap ${
            currentMode === 'after'
              ? 'border-[rgba(0,212,146,0.4)] bg-[rgba(0,212,146,0.16)] text-[#00d492]'
              : 'border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.16)] text-[#f59e0b]'
          }`}
        >
          {currentMode === 'after' ? 'COMPLETED' : 'ACCIDENT INTAKE'}
        </div>
      </div>

      {/* Body */}
      <div className='flex flex-1 flex-col justify-between gap-5 p-6'>
        <div className='flex flex-col items-start gap-2.5'>
          <span className='font-[family-name:var(--font-inter)] text-[11px] leading-normal tracking-[0.88px] text-[#b5b5b5] uppercase'>
            {project.serviceCategory}
          </span>
          <h3 className='font-[family-name:var(--font-manrope)] text-[22px] leading-7 font-bold tracking-[-0.11px] text-white'>
            {project.title}
          </h3>
          <p className='font-[family-name:var(--font-inter)] text-sm leading-[22px] text-[#b5b5b5]'>
            {project.description}
          </p>
        </div>

        <dl className='flex flex-col gap-2 border-t border-[#2a2a30] pt-4 font-[family-name:var(--font-inter)] leading-normal'>
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-[10px] tracking-[0.6px] text-[#999]'>VEHICLE</dt>
            <dd className='text-right text-[13px] font-medium text-white'>{project.vehicleModel}</dd>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-[10px] tracking-[0.6px] text-[#999]'>COMPLETED</dt>
            <dd className='text-right text-[13px] font-medium text-white'>
              {project.completedAt ? dateFormatter.format(new Date(project.completedAt)) : '—'}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

interface ProjectGridProps {
  projects: ProjectPublic[];
}

// Category chips + Results-style card grid. Filtering is client-side over the published list;
// any admin-entered category missing from the default chips gets its own chip appended.
export function ProjectGrid({ projects }: ProjectGridProps) {
  const [active, setActive] = useState(ALL_FILTER);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filters = useMemo(() => {
    const known = new Set(DEFAULT_FILTERS.map(normalize));
    const extras: string[] = [];
    for (const project of projects) {
      const key = normalize(project.serviceCategory);
      if (key && !known.has(key)) {
        known.add(key);
        extras.push(project.serviceCategory.trim());
      }
    }
    return [...DEFAULT_FILTERS, ...extras];
  }, [projects]);

  const filtered = useMemo(
    () =>
      active === ALL_FILTER
        ? projects
        : projects.filter((project) => normalize(project.serviceCategory) === normalize(active)),
    [projects, active],
  );

  if (projects.length === 0) {
    return (
      <p className='font-[family-name:var(--font-inter)] text-base leading-[26px] text-[#b5b5b5]'>
        No projects published yet — check back soon.
      </p>
    );
  }

  const handleFilter = (filter: string) => {
    setActive(filter);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className='flex flex-col gap-10 sm:gap-12'>
      <PortfolioFilters filters={filters} active={active} onChange={handleFilter} />

      {filtered.length === 0 ? (
        <div className='rounded-2xl border border-[#2a2a30] bg-[#1b1b20] px-6 py-12 text-center font-[family-name:var(--font-inter)] text-base leading-[26px] text-[#b5b5b5]'>
          No {active.toLowerCase()} projects published yet.
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filtered.slice(0, visible).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {filtered.length > visible && (
        <div className='flex justify-center'>
          <button
            type='button'
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className={`${BUTTON_SECONDARY} w-full sm:w-auto`}
          >
            Load more projects
          </button>
        </div>
      )}
    </div>
  );
}
