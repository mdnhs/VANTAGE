'use client';

import { TiltArticle } from '@/components/marketing/ui/tilt-article';

import { SectionTitle } from '@/components/marketing/ui/section-title';

import { RevealContent } from '@/components/marketing/ui/reveal-content';
import { useCallback, useEffect, useRef, useState } from 'react';

const DOT_ICON = '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg';
const ARROW_ICON = '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg';

// Figma phase icons, assigned by display position (search → upload → shield → wrench → check).
// `group` / `bleed` reproduce Figma's vector-group insets inside the 24px icon box.
const STEP_ICONS = [
  {
    src: '/assets/landing/7014327f3b3a28044c6d83372f3ae7ed2338cdb9.svg',
    width: 19.5,
    height: 19.5,
    group: 'inset-[12.5%]',
    bleed: 'inset-[-4.17%]',
  },
  {
    src: '/assets/landing/a040ac963b45b1fbfa1c62b72c7c3c132b362d22.svg',
    width: 19.5,
    height: 19.5,
    group: 'inset-[12.5%]',
    bleed: 'inset-[-4.17%]',
  },
  {
    src: '/assets/landing/afb104c65bc9dcaca299d4dbe2986eddd95db7b1.svg',
    width: 19.5,
    height: 21.5,
    group: 'inset-[8.33%_12.5%]',
    bleed: 'inset-[-3.75%_-4.17%]',
  },
  {
    src: '/assets/landing/27dd4d145d77b85cea2b2c70831eff96b56c1c0e.svg',
    width: 20.5,
    height: 20.5,
    group: 'inset-[10.42%]',
    bleed: 'inset-[-3.95%]',
  },
  {
    src: '/assets/landing/83723bbec597669a0a605222191e572d60945817.svg',
    width: 15.5,
    height: 12.5,
    group: 'inset-[27.08%_20.83%]',
    bleed: 'inset-[-6.82%_-5.36%]',
  },
];

// Homepage copy from the Figma design; the /process page passes its CMS-managed title instead.
const DEFAULT_TITLE = 'Our {count}-Step Repair Standard.';

// Left offset that lines the scroller's first card up with the 1200px content column.
const TRACK_GUTTER =
  'pl-5 pr-5 scroll-pl-5 sm:pl-6 sm:pr-6 sm:scroll-pl-6 xl:pl-[calc((100%-1200px)/2)] xl:pr-[calc((100%-1200px)/2)] xl:scroll-pl-[calc((100%-1200px)/2)]';

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  isHighlighted: boolean;
}

interface StitchProcessProps {
  steps: ProcessStep[];
  eyebrow?: string;
  title?: string;
  subtext?: string;
}

function ArrowIcon() {
  return (
    <span className='relative size-6 shrink-0 overflow-hidden'>
      <span className='absolute inset-y-1/4 right-[37.5%] left-[37.5%]'>
        <span className='absolute inset-[-6.25%_-12.5%]'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ARROW_ICON} alt='' width={7.5} height={13.5} className='block size-full max-w-none' />
        </span>
      </span>
    </span>
  );
}

// Content is CMS-driven (Dashboard → Homepage Process Steps) — the step number shown is
// derived from display order (index + 1), not stored as a column.
export function StitchProcess({
  steps,
  eyebrow = 'Predictable & Certified Workflow',
  title = DEFAULT_TITLE,
  subtext,
}: StitchProcessProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 1;
    setActiveIndex(Math.min(steps.length - 1, Math.round(track.scrollLeft / step)));
    setProgress(maxScroll > 0 ? track.scrollLeft / maxScroll : 1);
    setCanScroll({ prev: track.scrollLeft > 1, next: track.scrollLeft < maxScroll - 1 });
  }, [steps.length]);

  useEffect(() => {
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [sync]);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    track.scrollBy({ left: direction * (card.offsetWidth + 20), behavior: 'smooth' });
  };

  if (steps.length === 0) return null;

  const words = title.replace('{count}', String(steps.length)).split(' ');
  const splitAt = words.length > 2 ? words.length - 2 : words.length;
  const headLine = words.slice(0, splitAt).join(' ');
  const accentLine = words.slice(splitAt).join(' ');

  // Figma shows a 300/1200 thumb at rest that grows to full width at the end of the track.
  const fill = 25 + progress * 75;

  return (
    <section id='process' className='w-full overflow-hidden bg-[#20252d] py-14 sm:bg-[#1b1f26] sm:py-24 lg:py-[120px]'>
      {/* Header */}
      <div className='mx-auto flex w-full max-w-[1200px] items-end justify-between gap-6 px-5 sm:px-6 xl:px-0'>
        <div className='flex max-w-[720px] flex-col items-start gap-3.5 sm:gap-5'>
          <span className='flex items-center gap-2.5 rounded-full border border-[#353c47] bg-[#2e343e] py-1.5 pr-3 pl-2.5 sm:bg-[#262b34] sm:py-[7px] sm:pr-4 sm:pl-3.5'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DOT_ICON} alt='' width={6} height={6} className='block size-1.5' />
            <span className='font-site-body text-[11px] leading-normal font-medium tracking-[0.06em] text-[#c9ced6] uppercase sm:font-normal sm:tracking-[0.44px]'>
              {eyebrow}
            </span>
          </span>
          <SectionTitle className='max-w-[560px] font-site-heading text-[30px] leading-[1.08] font-extrabold tracking-[-0.3px] text-[#f1f3f6] uppercase sm:text-[40px] sm:leading-[46px] sm:tracking-[-0.64px] lg:text-[48px] lg:leading-[54px] lg:tracking-[-0.96px]'>
            {headLine}
            {accentLine && (
              <>
                <br />
                <span className='text-brand'>{accentLine}</span>
              </>
            )}
          </SectionTitle>
          {subtext && (
            <p className='max-w-[560px] font-site-body text-base leading-[1.55] text-[#b9bfc9] sm:leading-[26px]'>
              {subtext}
            </p>
          )}
        </div>

        <div className='hidden shrink-0 gap-3 sm:flex'>
          <button
            data-reveal-button
            type='button'
            onClick={() => scrollByCard(-1)}
            disabled={!canScroll.prev}
            aria-label='Previous step'
            aria-controls='process-track'
            className='relative flex size-[52px] items-center justify-center overflow-hidden rounded-[26px] border border-[#353c47] bg-[#2e343e] transition-colors hover:border-brand focus-visible:border-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#262b34] disabled:hover:border-[#353c47]'
          >
            <RevealContent band='brand'>
              <span className='flex rotate-180'>
                <ArrowIcon />
              </span>
            </RevealContent>
          </button>
          <button
            data-reveal-button
            type='button'
            onClick={() => scrollByCard(1)}
            disabled={!canScroll.next}
            aria-label='Next step'
            aria-controls='process-track'
            className='relative flex size-[52px] items-center justify-center overflow-hidden rounded-[26px] border border-[#353c47] bg-[#2e343e] transition-colors hover:border-brand focus-visible:border-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#262b34] disabled:hover:border-[#353c47]'
          >
            <RevealContent band='brand'>
              <ArrowIcon />
            </RevealContent>
          </button>
        </div>
      </div>

      {/* Mobile: the same phases as a vertical timeline (number rail on the left) */}
      <ol data-timeline className='mx-auto mt-7 flex w-full max-w-[1200px] flex-col px-5 sm:hidden'>
        {steps.map((step, index) => {
          const icon = STEP_ICONS[index % STEP_ICONS.length];
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} data-timeline-step className='flex items-stretch gap-4'>
              <div className='flex shrink-0 flex-col items-center gap-1.5'>
                <span
                  data-timeline-dot
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border font-site-heading text-sm font-extrabold text-[#f1f3f6] ${
                    isFirst ? 'border-brand bg-brand' : 'border-[#3e4551] bg-[#262b34]'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                {!isLast && (
                  <span aria-hidden='true' className='relative min-h-px w-0.5 flex-1 overflow-hidden bg-[#3e4551]'>
                    {/* Filled red from the top by the scroll animation (PageAnimations) */}
                    <span data-timeline-fill className='absolute inset-0 origin-top scale-y-0 bg-brand' />
                  </span>
                )}
              </div>
              <div data-timeline-body className={`flex min-w-0 flex-1 flex-col gap-1.5 pt-2 ${isLast ? '' : 'pb-7'}`}>
                <div className='flex items-center gap-2'>
                  <span aria-hidden='true' className='relative size-4 shrink-0 overflow-hidden opacity-70 invert'>
                    <span className={`absolute ${icon.group}`}>
                      <span className={`absolute ${icon.bleed}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={icon.src}
                          alt=''
                          width={icon.width}
                          height={icon.height}
                          className='block size-full max-w-none'
                        />
                      </span>
                    </span>
                  </span>
                  <h3 className='font-site-heading text-[17px] leading-[1.3] font-semibold text-[#f1f3f6]'>
                    {step.title}
                  </h3>
                </div>
                <p className='font-site-body text-sm leading-[1.5] text-[#a4abb6]'>{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Phase cards — horizontally scrolling, bleeding off the right edge (tablet and up) */}
      <div
        id='process-track'
        ref={trackRef}
        data-process-track
        onScroll={sync}
        className={`mt-5 -mb-2 hidden snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto py-2 sm:mt-10 sm:flex sm:gap-5 [&::-webkit-scrollbar]:hidden ${TRACK_GUTTER}`}
      >
        {steps.map((step, index) => {
          const icon = STEP_ICONS[index % STEP_ICONS.length];
          const isActive = index === activeIndex;

          return (
            <TiltArticle
              key={step.id}
              className='flex w-[85vw] max-w-[400px] shrink-0 snap-start flex-col gap-8 rounded-[18px] border border-[#353c47] bg-[#262b34] p-5 sm:w-[400px] sm:gap-14 sm:rounded-[20px] sm:p-8'
            >
              <div className='flex items-center justify-between'>
                <div className='flex size-[52px] items-center justify-center overflow-hidden rounded-2xl bg-[#f1f3f6]'>
                  <span className='relative size-6 shrink-0 overflow-hidden'>
                    <span className={`absolute ${icon.group}`}>
                      <span className={`absolute ${icon.bleed}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={icon.src}
                          alt=''
                          width={icon.width}
                          height={icon.height}
                          className='block size-full max-w-none'
                        />
                      </span>
                    </span>
                  </span>
                </div>
                <span
                  className={`font-site-heading text-[56px] leading-normal font-extrabold tracking-[-1.68px] whitespace-nowrap transition-colors duration-300 ${
                    isActive ? 'text-[#e2e6eb]' : 'text-[#525a67]'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className='flex flex-col gap-3'>
                <h3 className='font-site-heading text-[17px] leading-[1.3] font-semibold text-[#f1f3f6] sm:text-[22px] sm:leading-normal sm:font-bold'>
                  {step.title}
                </h3>
                <p className='font-site-body text-sm leading-[1.5] text-[#a4abb6] sm:leading-[22px] sm:text-[#b9bfc9]'>
                  {step.description}
                </p>
              </div>
            </TiltArticle>
          );
        })}
      </div>

      {/* Progress */}
      <div className='mx-auto mt-7 hidden w-full max-w-[1200px] px-5 sm:mt-12 sm:block sm:px-6 xl:px-0'>
        <div className='h-0.5 w-full bg-[#2e343e]' role='presentation'>
          <div
            className='h-0.5 bg-gradient-to-r from-brand to-brand-mid transition-[width] duration-200'
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>
    </section>
  );
}
