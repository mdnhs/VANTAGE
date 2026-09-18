'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CaseStudy {
  id: string;
  category: string;
  title: string;
  description: string;
  timeline: string;
  paintCode: string;
  beforeImg: string;
  afterImg: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'porsche-911',
    category: 'Bare-Metal Respray',
    title: 'Porsche 911 (992) Carrera GTS',
    description:
      'Complete exterior restoration, acid dip treatment, 4 coats of Guards Red (G1) with ceramic clear coat finish.',
    timeline: '12 Working Days',
    paintCode: 'Porsche G1 Carmine',
    beforeImg: '/assets/marketing/project-porsche-911-before.jpg',
    afterImg: '/assets/marketing/project-porsche-911-after.jpg',
  },
  {
    id: 'bmw-m4',
    category: 'Quarter Panel Reconstruction',
    title: 'BMW 3 Series M-Sport (G20)',
    description:
      'Rear side impact repair, OEM quarter section replacement with factory laser weld seams and robotic seam sealing.',
    timeline: '6 Working Days',
    paintCode: 'BMW C31 Portimao Blue',
    beforeImg: '/assets/marketing/project-bmw-3-series-before.jpg',
    afterImg: '/assets/marketing/project-bmw-3-series-after.jpg',
  },
  {
    id: 'audi-rs6',
    category: 'Front Wing & ADAS Calibration',
    title: 'Audi RS6 Avant Carbon Edition',
    description:
      'Aluminum wing reconstruction, matrix LED headlight installation, and dynamic ADAS radar realignment on digital rig.',
    timeline: '5 Working Days',
    paintCode: 'Audi Nardo Grey (LY7C)',
    beforeImg: '/assets/marketing/project-audi-rs6-before.jpg',
    afterImg: '/assets/marketing/project-audi-rs6-after.jpg',
  },
];

export function StitchCaseStudies() {
  const [viewState, setViewState] = useState<Record<string, 'after' | 'before'>>({
    'porsche-911': 'after',
    'bmw-m4': 'after',
    'audi-rs6': 'after',
  });

  const toggleView = (id: string) => {
    setViewState((prev) => ({
      ...prev,
      [id]: prev[id] === 'after' ? 'before' : 'after',
    }));
  };

  return (
    <section id='work' className='container mx-auto px-6 py-24 sm:px-12'>
      {/* Header */}
      <div className='mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <span className='flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-[#dc2626] uppercase'>
            <span className='h-px w-6 bg-[#dc2626]' />
            Verified Results
          </span>
          <h2 className='font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-tight text-white uppercase lg:text-[40px] lg:leading-[48px]'>
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
          View 140+ Case Studies <ArrowRight className='size-3.5' />
        </Link>
      </div>

      {/* 3 Case Study Cards */}
      <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
        {CASE_STUDIES.map((study) => {
          const currentMode = viewState[study.id] || 'after';
          const currentImg = currentMode === 'after' ? study.afterImg : study.beforeImg;

          return (
            <div
              key={study.id}
              className='group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#161616] transition-all hover:border-[#dc2626]/50'
            >
              {/* Image Preview with Mode Toggle */}
              <div className='relative h-64 w-full overflow-hidden bg-black'>
                <Image
                  src={currentImg}
                  alt={`${study.title} ${currentMode}`}
                  fill
                  className='object-cover transition-transform duration-500 group-hover:scale-105'
                />

                {/* Top Badge: Before/After Toggle */}
                <button
                  type='button'
                  onClick={() => toggleView(study.id)}
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
                  <div className='mb-1 font-mono text-xs tracking-wider text-[#dc2626] uppercase'>{study.category}</div>
                  <h3 className='mb-2 font-[family-name:var(--font-manrope)] text-2xl leading-8 font-semibold text-white'>
                    {study.title}
                  </h3>
                  <p className='mb-4 text-base leading-6 text-neutral-400'>{study.description}</p>
                </div>

                <div className='space-y-2 border-t border-white/5 pt-4 font-mono text-xs'>
                  <div className='flex justify-between text-neutral-400'>
                    <span>Repair Timeline:</span>
                    <span className='text-white'>{study.timeline}</span>
                  </div>
                  <div className='flex justify-between text-neutral-400'>
                    <span>Paint Code:</span>
                    <span className='text-white'>{study.paintCode}</span>
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
