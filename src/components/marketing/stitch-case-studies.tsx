'use client';

import { ClipReveal } from '@/components/marketing/ui/reveal';

import { TiltArticle } from '@/components/marketing/ui/tilt-article';

import { SectionTitle } from '@/components/marketing/ui/section-title';

import { RevealContent } from '@/components/marketing/ui/reveal-content';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sizedSrc } from '@/lib/media/public-image';
import { projectPath } from '@/lib/seo/detail-paths';
import type { ProjectPublic } from '@/features/projects/types';

type FeaturedProject = Pick<
  ProjectPublic,
  | 'id'
  | 'slug'
  | 'title'
  | 'vehicleModel'
  | 'serviceCategory'
  | 'beforeImage'
  | 'afterImage'
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
    <section id='work' className='w-full bg-[#1b1f26] py-14 sm:bg-[#20252d] sm:py-24 lg:py-[120px]'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 sm:gap-12 sm:px-6 lg:gap-16 xl:px-0'>
        {/* Header */}
        <div className='flex flex-col items-start justify-between gap-3.5 sm:gap-6 lg:flex-row lg:items-end'>
          <div className='flex flex-col items-start gap-3.5 sm:gap-5'>
            <span className='flex items-center gap-2.5 rounded-full border border-[#353c47] bg-[#2e343e] py-1.5 pr-3 pl-2.5 sm:py-[7px] sm:pr-4 sm:pl-3.5'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={DOT_ICON} alt='' width={6} height={6} className='block size-1.5' />
              <span className='font-site-body text-[11px] leading-normal font-medium tracking-[0.06em] text-[#c9ced6] uppercase sm:font-normal sm:tracking-[0.44px]'>
                Verified Results
              </span>
            </span>
            <SectionTitle className='max-w-[560px] font-site-heading text-[30px] leading-[1.08] font-extrabold tracking-[-0.3px] text-[#f1f3f6] sm:text-[40px] sm:leading-[46px] sm:tracking-[-0.64px] lg:text-[48px] lg:leading-[54px] lg:tracking-[-0.96px]'>
              BEFORE &amp; AFTER <span className='text-brand'>RESTORATION PROOF.</span>
            </SectionTitle>
          </div>
          <p className='max-w-[440px] font-site-body text-base leading-[1.55] text-[#b9bfc9] sm:leading-[26px]'>
            Zero flaws, undetectable colour transitions and exact factory panel gaps, inspected under 2,000-lumen
            lighting.
          </p>
        </div>

        {/* Case Study Cards */}
        <div className='grid grid-cols-1 gap-6 max-sm:-mx-5 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-5 max-sm:[scrollbar-width:none] max-sm:gap-3 max-sm:overflow-x-auto max-sm:overscroll-x-contain max-sm:px-5 md:grid-cols-2 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden'>
          {projects.map((project) => {
            const currentMode = viewState[project.id] ?? 'after';
            const current = currentMode === 'after' ? project.afterImage : project.beforeImage;

            return (
              <TiltArticle
                key={project.id}
                className='group relative flex flex-col overflow-hidden rounded-[18px] border border-[#353c47] bg-[#262b34] transition-colors hover:border-brand/50 max-sm:w-[310px] max-sm:shrink-0 max-sm:snap-start sm:rounded-2xl'
              >
                {/* Photo with Before/After toggle */}
                <ClipReveal className='relative h-[200px] w-full shrink-0 overflow-hidden bg-black sm:h-64'>
                  {current && (
                    <Image
                      src={sizedSrc(current, 'w_800,h_512,c_fill')}
                      style={{ objectPosition: `${current.focal.x * 100}% ${current.focal.y * 100}%` }}
                      alt={`${project.title} ${currentMode}`}
                      fill
                      sizes='(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw'
                      className='object-cover transition-transform duration-500 group-hover:scale-105'
                    />
                  )}

                  <button
                    type='button'
                    onClick={() => toggleView(project.id)}
                    aria-label={currentMode === 'after' ? 'Show before photo' : 'Show after photo'}
                    className='absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-white/12 bg-[rgba(27,31,38,0.8)] px-3 py-[7px] font-site-body text-[10px] leading-normal whitespace-nowrap backdrop-blur-md transition-colors hover:border-brand focus-visible:border-brand focus-visible:outline-none sm:top-4 sm:left-4'
                  >
                    <span
                      className={`tracking-[0.6px] ${currentMode === 'before' ? 'font-medium text-[#f1f3f6]' : 'text-[#7d8591]'}`}
                    >
                      BEFORE
                    </span>
                    <span className='text-[#7d8591]'>/</span>
                    <span
                      className={`tracking-[0.6px] ${currentMode === 'after' ? 'font-medium text-[#f1f3f6]' : 'text-[#7d8591]'}`}
                    >
                      AFTER
                    </span>
                  </button>

                  <div
                    className={`absolute right-3.5 bottom-4 flex items-center rounded-md border px-2.5 py-1.5 font-site-body text-[10px] leading-normal tracking-[0.6px] whitespace-nowrap max-sm:top-3 max-sm:right-3 max-sm:bottom-auto max-sm:rounded-full ${
                      currentMode === 'after'
                        ? 'border-[rgba(0,212,146,0.4)] bg-[rgba(0,212,146,0.16)] text-[#00d492]'
                        : 'border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.16)] text-[#f59e0b]'
                    }`}
                  >
                    {currentMode === 'after' ? 'COMPLETED' : 'ACCIDENT INTAKE'}
                  </div>
                </ClipReveal>

                {/* Body */}
                <div className='flex flex-1 flex-col justify-between gap-5 p-[18px] sm:p-6'>
                  <div className='flex flex-col items-start gap-2 sm:gap-2.5'>
                    <span className='font-site-body text-[11px] leading-normal font-medium tracking-[0.88px] text-brand uppercase sm:font-normal sm:text-[#b9bfc9]'>
                      {project.serviceCategory}
                    </span>
                    <h3 className='font-site-heading text-[17px] leading-[1.3] font-semibold text-[#f1f3f6] sm:text-[22px] sm:leading-7 sm:font-bold sm:tracking-[-0.11px]'>
                      {/* Stretched over the whole card (the ::after layer), so a click anywhere opens the
                        project; the Before/After toggle sits above it with z-10. */}
                      <Link
                        href={projectPath(project.slug)}
                        className="transition-colors outline-none group-hover:text-brand after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-brand"
                      >
                        {project.title}
                      </Link>
                    </h3>
                    <p className='font-site-body text-sm leading-[1.5] text-[#a4abb6] sm:leading-[22px] sm:text-[#b9bfc9]'>
                      {project.description}
                    </p>
                  </div>

                  <dl className='flex flex-col gap-2 border-t border-[#353c47] pt-3 font-site-body leading-normal sm:pt-4'>
                    <div className='flex items-center justify-between gap-4'>
                      <dt className='text-[10px] tracking-[0.6px] text-[#999] sm:text-[#9aa1ac]'>VEHICLE</dt>
                      <dd className='text-right text-[13px] font-medium text-[#f1f3f6]'>{project.vehicleModel}</dd>
                    </div>
                    <div className='flex items-center justify-between gap-4'>
                      <dt className='text-[10px] tracking-[0.6px] text-[#999] sm:text-[#9aa1ac]'>COMPLETED</dt>
                      <dd className='text-right text-[13px] font-medium text-[#f1f3f6]'>
                        {project.completedAt ? dateFormatter.format(new Date(project.completedAt)) : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </TiltArticle>
            );
          })}
        </div>

        {/* CTA */}
        <div className='flex justify-center'>
          <Link
            data-reveal-button
            href='/our-work'
            className='relative flex min-h-[52px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-[#3e4551] bg-[#2e343e] py-[15px] pr-[21px] pl-[23px] font-site-body text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-[#f1f3f6] uppercase transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:min-h-0 sm:w-auto sm:rounded-lg sm:border-brand sm:bg-brand sm:drop-shadow-[0px_8px_14px_rgb(var(--brand-rgb)/0.35)]'
          >
            <RevealContent band='dark' className='gap-2.5'>
              View all case studies
              <span className='relative size-6 shrink-0 overflow-hidden'>
                <span className='absolute inset-y-1/4 right-[37.5%] left-[37.5%]'>
                  <span className='absolute inset-[-6.25%_-12.5%]'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ARROW_ICON} alt='' width={7.5} height={13.5} className='block size-full max-w-none' />
                  </span>
                </span>
              </span>
            </RevealContent>
          </Link>
        </div>
      </div>
    </section>
  );
}
