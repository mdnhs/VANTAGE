'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

const dateFormatter = new Intl.DateTimeFormat('en-IE', { year: 'numeric', month: 'short' });

const DOT_ICON = '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg';
const ARROW_ICON = '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg';

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
    <section id='work' className='w-full bg-[#16161a] py-16 sm:py-24 lg:py-[120px]'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 sm:gap-12 sm:px-6 lg:gap-16 xl:px-0'>
        {/* Header */}
        <div className='flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end'>
          <div className='flex flex-col items-start gap-5'>
            <span className='flex items-center gap-2.5 rounded-full border border-[#2a2a30] bg-[#232323] py-[7px] pr-4 pl-3.5'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DOT_ICON} alt='' width={6} height={6} className='block size-1.5' />
              <span className='font-[family-name:var(--font-inter)] text-[11px] leading-normal tracking-[0.44px] text-[#c6c6c6] uppercase'>
                Verified Results
              </span>
            </span>
            <h2 className='max-w-[560px] font-[family-name:var(--font-manrope)] text-[32px] leading-[38px] font-extrabold tracking-[-0.64px] text-white sm:text-[40px] sm:leading-[46px] lg:text-[48px] lg:leading-[54px] lg:tracking-[-0.96px]'>
              BEFORE &amp; AFTER <span className='text-[#dc2626]'>RESTORATION PROOF.</span>
            </h2>
          </div>
          <p className='max-w-[440px] font-[family-name:var(--font-inter)] text-base leading-[26px] text-[#b5b5b5]'>
            Zero flaws, undetectable colour transitions and exact factory panel gaps, inspected under 2,000-lumen
            lighting.
          </p>
        </div>

        {/* Case Study Cards */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {projects.map((project) => {
            const currentMode = viewState[project.id] ?? 'after';
            const currentPublicId = currentMode === 'after' ? project.afterImagePublicId : project.beforeImagePublicId;

            return (
              <article
                key={project.id}
                className='group flex flex-col overflow-hidden rounded-2xl border border-[#2a2a30] bg-[#1b1b20] transition-colors hover:border-[#dc2626]/50'
              >
                {/* Photo with Before/After toggle */}
                <div className='relative h-64 w-full shrink-0 overflow-hidden bg-black'>
                  <Image
                    src={cldUrl(currentPublicId ?? '', { width: 800, height: 512, crop: 'fill' })}
                    alt={`${project.title} ${currentMode}`}
                    fill
                    sizes='(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw'
                    className='object-cover transition-transform duration-500 group-hover:scale-105'
                  />

                  <button
                    type='button'
                    onClick={() => toggleView(project.id)}
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
          })}
        </div>

        {/* CTA */}
        <div className='flex justify-center'>
          <Link
            href='/our-work'
            className='flex items-center gap-2.5 rounded-lg bg-[#dc2626] py-4 pr-[22px] pl-6 font-[family-name:var(--font-inter)] text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-white uppercase drop-shadow-[0px_8px_14px_rgba(220,38,38,0.35)] transition-colors hover:bg-[#b91c1c] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none'
          >
            View all case studies
            <span className='relative size-6 shrink-0 overflow-hidden'>
              <span className='absolute inset-y-1/4 right-[37.5%] left-[37.5%]'>
                <span className='absolute inset-[-6.25%_-12.5%]'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ARROW_ICON} alt='' width={7.5} height={13.5} className='block size-full max-w-none' />
                </span>
              </span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
