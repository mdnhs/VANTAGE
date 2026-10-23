'use client';

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
  'pl-4 pr-4 scroll-pl-4 sm:pl-6 sm:pr-6 sm:scroll-pl-6 xl:pl-[calc((100%-1200px)/2)] xl:pr-[calc((100%-1200px)/2)] xl:scroll-pl-[calc((100%-1200px)/2)]';

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
    <section id='process' className='w-full overflow-hidden bg-[#111113] py-16 sm:py-24 lg:py-[120px]'>
      {/* Header */}
      <div className='mx-auto flex w-full max-w-[1200px] items-end justify-between gap-6 px-4 sm:px-6 xl:px-0'>
        <div className='flex max-w-[720px] flex-col items-start gap-5'>
          <span className='flex items-center gap-2.5 rounded-full border border-[#2a2a30] bg-[#1b1b20] py-[7px] pr-4 pl-3.5'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DOT_ICON} alt='' width={6} height={6} className='block size-1.5' />
            <span className='font-site-body text-[11px] leading-normal tracking-[0.44px] text-[#c6c6c6] uppercase'>
              {eyebrow}
            </span>
          </span>
          <h2 className='max-w-[560px] font-site-heading text-[32px] leading-[38px] font-extrabold tracking-[-0.64px] text-white uppercase sm:text-[40px] sm:leading-[46px] lg:text-[48px] lg:leading-[54px] lg:tracking-[-0.96px]'>
            {headLine}
            {accentLine && (
              <>
                <br />
                <span className='text-brand'>{accentLine}</span>
              </>
            )}
          </h2>
          {subtext && <p className='max-w-[560px] font-site-body text-base leading-[26px] text-[#b5b5b5]'>{subtext}</p>}
        </div>

        <div className='hidden shrink-0 gap-3 sm:flex'>
          <button
            type='button'
            onClick={() => scrollByCard(-1)}
            disabled={!canScroll.prev}
            aria-label='Previous step'
            aria-controls='process-track'
            className='flex size-[52px] items-center justify-center rounded-[26px] border border-[#2a2a30] bg-[#252525] transition-colors hover:border-brand focus-visible:border-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#1b1b20] disabled:hover:border-[#2a2a30]'
          >
            <span className='flex rotate-180'>
              <ArrowIcon />
            </span>
          </button>
          <button
            type='button'
            onClick={() => scrollByCard(1)}
            disabled={!canScroll.next}
            aria-label='Next step'
            aria-controls='process-track'
            className='flex size-[52px] items-center justify-center rounded-[26px] border border-[#2a2a30] bg-[#252525] transition-colors hover:border-brand focus-visible:border-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-[#1b1b20] disabled:hover:border-[#2a2a30]'
          >
            <ArrowIcon />
          </button>
        </div>
      </div>

      {/* Phase cards — horizontally scrolling, bleeding off the right edge */}
      <div
        id='process-track'
        ref={trackRef}
        data-process-track
        onScroll={sync}
        className={`mt-10 flex snap-x snap-mandatory [scrollbar-width:none] gap-5 overflow-x-auto sm:mt-12 [&::-webkit-scrollbar]:hidden ${TRACK_GUTTER}`}
      >
        {steps.map((step, index) => {
          const icon = STEP_ICONS[index % STEP_ICONS.length];
          const isActive = index === activeIndex;

          return (
            <article
              key={step.id}
              className='flex w-[85vw] max-w-[400px] shrink-0 snap-start flex-col gap-14 rounded-[20px] border border-[#2a2a30] bg-[#1b1b20] p-8 sm:w-[400px]'
            >
              <div className='flex items-center justify-between'>
                <div className='flex size-[52px] items-center justify-center overflow-hidden rounded-2xl bg-white'>
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
                    isActive ? 'text-[#dedede]' : 'text-[#434343]'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className='flex flex-col gap-3'>
                <h3 className='font-site-heading text-[22px] leading-normal font-bold text-white'>{step.title}</h3>
                <p className='font-site-body text-sm leading-[22px] text-[#b5b5b5]'>{step.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Progress */}
      <div className='mx-auto mt-10 w-full max-w-[1200px] px-4 sm:mt-12 sm:px-6 xl:px-0'>
        <div className='h-0.5 w-full bg-[#252525]' role='presentation'>
          <div
            className='h-0.5 bg-gradient-to-r from-brand to-brand-mid transition-[width] duration-200'
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>
    </section>
  );
}
