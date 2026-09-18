'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';
import type { Project } from '@/server/db/schema';

type FeaturedProject = Pick<
  Project,
  | 'id'
  | 'title'
  | 'vehicleModel'
  | 'serviceCategory'
  | 'beforeImagePublicId'
  | 'afterImagePublicId'
  | 'description'
  | 'completedAt'
>;

interface StitchCaseStudiesProps {
  projects: FeaturedProject[];
}

const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150', 'motion-delay-300'];

const dateFormatter = new Intl.DateTimeFormat('en-IE', { year: 'numeric', month: 'short' });

// Sourced from the featured, published Projects (admin-managed under Dashboard → Projects) —
// no separate content type for case studies, this section just presents a slice of Projects.
export function StitchCaseStudies({ projects }: StitchCaseStudiesProps) {
  const [viewState, setViewState] = useState<Record<string, 'after' | 'before'>>({});

  if (projects.length === 0) return null;

  const toggleView = (id: string) => {
    setViewState((prev) => ({
      ...prev,
      [id]: prev[id] === 'before' ? 'after' : 'before',
    }));
  };

  return (
    <section id='work' className='container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-12'>
      {/* Header */}
      <div className='intersect-once mb-10 flex flex-col items-start justify-between gap-6 sm:mb-12 md:flex-row md:items-end intersect:motion-preset-slide-up'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <span className='flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-[#dc2626] uppercase'>
            <span className='h-px w-6 bg-[#dc2626]' />
            Verified Results
          </span>
          <h2 className='font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-white uppercase sm:text-4xl lg:text-[40px] lg:leading-[48px]'>
            Before &amp; After <br />
            <span className='text-[#dc2626]'>Restoration Proof.</span>
          </h2>
          <p className='text-base leading-6 text-neutral-400'>
            Zero flaws, undetectable color transitions, and exact factory panel gaps inspected under 2,000-lumen
            lighting.
          </p>
        </div>

        <Link
          href='/our-work'
          className='flex items-center gap-1.5 border-b border-neutral-600 pb-1 font-mono text-xs tracking-widest text-neutral-300 uppercase hover:text-white'
        >
          View All Case Studies <ArrowRight className='size-3.5' />
        </Link>
      </div>

      {/* Case Study Cards */}
      <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
        {projects.map((project, index) => {
          const currentMode = viewState[project.id] ?? 'after';
          const currentPublicId = currentMode === 'after' ? project.afterImagePublicId : project.beforeImagePublicId;

          return (
            <div
              key={project.id}
              className={`group intersect-once flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#161616] transition-all hover:border-[#dc2626]/50 intersect:motion-preset-slide-up ${STAGGER_DELAY[index % STAGGER_DELAY.length]}`}
            >
              {/* Image Preview with Mode Toggle */}
              <div className='relative h-64 w-full overflow-hidden bg-black'>
                <Image
                  src={cldUrl(currentPublicId, { width: 640, height: 480, crop: 'fill' })}
                  alt={`${project.title} ${currentMode}`}
                  fill
                  className='object-cover transition-transform duration-500 group-hover:scale-105'
                />

                {/* Top Badge: Before/After Toggle */}
                <button
                  type='button'
                  onClick={() => toggleView(project.id)}
                  aria-label={currentMode === 'after' ? 'Show before photo' : 'Show after photo'}
                  className='absolute top-3 left-3 rounded border border-white/10 bg-black/80 px-2.5 py-1 font-mono text-[10px] text-white backdrop-blur-md transition-colors hover:border-[#dc2626]'
                >
                  <span className={currentMode === 'before' ? 'text-[#dc2626]' : undefined}>BEFORE</span> /{' '}
                  <span className={currentMode === 'after' ? 'text-[#dc2626]' : undefined}>AFTER</span>
                </button>

                {/* Status Indicator */}
                <div
                  className={`absolute right-3 bottom-3 rounded px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${
                    currentMode === 'after' ? 'bg-[#dc2626] text-white' : 'bg-amber-600 text-black'
                  }`}
                >
                  {currentMode === 'after' ? 'COMPLETED' : 'ACCIDENT INTAKE'}
                </div>
              </div>

              {/* Card Details */}
              <div className='flex flex-1 flex-col justify-between p-6'>
                <div>
                  <div className='mb-1 font-mono text-xs tracking-wider text-[#dc2626] uppercase'>
                    {project.serviceCategory}
                  </div>
                  <h3 className='mb-2 font-[family-name:var(--font-manrope)] text-xl leading-7 font-semibold text-white sm:text-2xl sm:leading-8'>
                    {project.title}
                  </h3>
                  <p className='mb-4 text-base leading-6 text-neutral-400'>{project.description}</p>
                </div>

                <div className='space-y-2 border-t border-white/5 pt-4 font-mono text-xs'>
                  <div className='flex justify-between text-neutral-400'>
                    <span>Vehicle:</span>
                    <span className='text-white'>{project.vehicleModel}</span>
                  </div>
                  <div className='flex justify-between text-neutral-400'>
                    <span>Completed:</span>
                    <span className='text-white'>
                      {project.completedAt ? dateFormatter.format(new Date(project.completedAt)) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
