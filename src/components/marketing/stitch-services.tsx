'use client';
/* eslint-disable @next/next/no-img-element -- Figma SVG icons render at intrinsic size */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  CarFront,
  Bandage,
  PaintRoller,
  Palette,
  Wand2,
  Wrench,
  Disc,
  ShieldCheck,
  Car,
  Sparkles,
  Shield,
  Flame,
  type LucideIcon,
} from 'lucide-react';
import type { ServicePublic } from '@/features/services/types';
import type { HomepageCatalogPublic } from '@/features/homepage-catalogs/types';

const ASSET = '/assets/landing';
const DOT_SRC = `${ASSET}/1606e632d7f1d3ed093428897b21854cb1b7b173.svg`;
const ARROW_UR_SRC = `${ASSET}/75ba6e24cb25814e63f8d38324b8746a14a2f33b.svg`;
const ARROW_SRC = `${ASSET}/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg`;

// Figma icon set (24px frame; the vector group is inset inside it, sized via `inset`).
interface FigmaIcon {
  src: string;
  width: number;
  height: number;
  inset: string;
}

const FIGMA_ICONS: FigmaIcon[] = [
  // accident
  {
    src: `${ASSET}/bf4553ed0c3464738a94a4a4ba471c653bdfaadd.svg`,
    width: 21.5,
    height: 21.5006,
    inset: 'inset-[8.33%]',
  },
  // car
  {
    src: `${ASSET}/c043f8532cec88263c5cd6b572ecada13a22b489.svg`,
    width: 21.5,
    height: 19.5,
    inset: 'inset-[12.5%_8.33%]',
  },
  // spray can
  {
    src: `${ASSET}/2320156679041562dcad5c686d80bf37bc7c85b6.svg`,
    width: 17.375,
    height: 21.25,
    inset: 'inset-[9.38%_17.19%_8.33%_16.67%]',
  },
  // pen
  {
    src: `${ASSET}/649d25e36f59ffb96c83f4b1870c863b917ecce9.svg`,
    width: 19.5001,
    height: 19.5,
    inset: 'inset-[12.5%]',
  },
];

// CMS icon keys that have a Figma-drawn equivalent.
const FIGMA_ICON_MAP: Record<string, FigmaIcon> = {
  'car-front': FIGMA_ICONS[0],
  bandage: FIGMA_ICONS[1],
  'paint-roller': FIGMA_ICONS[2],
  palette: FIGMA_ICONS[3],
};

const ICON_MAP: Record<string, LucideIcon> = {
  wand2: Wand2,
  wrench: Wrench,
  disc: Disc,
  'shield-check': ShieldCheck,
  car: Car,
  sparkles: Sparkles,
  shield: Shield,
  flame: Flame,
  // Only reached if the Figma map above is bypassed.
  'car-front': CarFront,
  bandage: Bandage,
  'paint-roller': PaintRoller,
  palette: Palette,
};

type CardIcon = { kind: 'figma'; icon: FigmaIcon } | { kind: 'lucide'; icon: LucideIcon };

interface ServiceCard {
  key: string;
  name: string;
  description: string;
  badge: string | null;
  footnote: string;
  icon: CardIcon;
  iconSrc: string | null;
}

function fallbackIcon(index: number): CardIcon {
  return { kind: 'figma', icon: FIGMA_ICONS[index % FIGMA_ICONS.length] };
}

function resolveIcon(key: string | null | undefined, index: number): CardIcon {
  if (key && FIGMA_ICON_MAP[key]) return { kind: 'figma', icon: FIGMA_ICON_MAP[key] };
  if (key && ICON_MAP[key]) return { kind: 'lucide', icon: ICON_MAP[key] };
  return fallbackIcon(index);
}

// Design catalogue, rendered until items are published from the CMS.
const DEFAULT_SERVICES: ServiceCard[] = [
  [
    'Crash & collision repair',
    'Major accident reconstruction, hydraulic bench pull and laser structural chassis realignment.',
    'Insurance Approved',
  ],
  [
    'Dent repair & PDR',
    'Paintless dent removal for parking dings and creases, preserving factory original paint.',
    'Zero Filler Used',
  ],
  [
    'Precision spray painting',
    'Spectrophotometer colour scanning, multi-stage pearls, metallic lacquers and infrared curing.',
    '100% Match Guarantee',
  ],
  [
    'Full vehicle resprays',
    'Bare-metal strip-downs, glass-out colour changes, matte transitions and bespoke finishes.',
    'Bespoke & Classic',
  ],
  [
    'Scratch & scuff correction',
    'Targeted bumper corner scuffs, vandal key scratches and localised high-blend micro-repairs.',
    'Express Turnaround',
  ],
  [
    'Panel replacement',
    'Original quarter panels, bonnets, wings, door skins and spot-welding to factory bulletins.',
    'Factory Tolerance',
  ],
  [
    'Alloy wheel refurbishment',
    'Diamond-cut CNC resurfacing, kerb rash weld repairs, straightening and powder coating.',
    'All Wheel Sizes',
  ],
  [
    'Ceramic coating & detailing',
    'Multi-stage machine de-swirling, 9H ceramic hydrophobic sealants and leather rejuvenation.',
    'Up to 7 Year Protection',
  ],
].map(([name, description, footnote], i) => ({
  key: name,
  name,
  description,
  badge: null,
  footnote,
  icon: fallbackIcon(i),
  iconSrc: null,
}));

function toCard(service: ServicePublic, index: number): ServiceCard {
  return {
    key: service.id,
    name: service.name,
    description: service.description,
    badge: service.startingPrice != null ? `From €${service.startingPrice}` : null,
    footnote: 'Free Estimate',
    icon: fallbackIcon(index),
    iconSrc: service.icon?.src ?? null,
  };
}

function catalogItemToCard(item: HomepageCatalogPublic, index: number): ServiceCard {
  return {
    key: item.id,
    name: item.title,
    description: item.description,
    badge: item.badge,
    footnote: item.footnote || 'Free Estimate',
    icon: resolveIcon(item.icon, index),
    iconSrc: item.iconImage?.src ?? null,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

interface StitchServicesProps {
  catalogItems?: HomepageCatalogPublic[];
  services?: ServicePublic[];
  eyebrow?: string | null;
  headlineLine1?: string | null;
  headlineAccent?: string | null;
  subtext?: string | null;
}

export function StitchServices({
  catalogItems,
  services,
  eyebrow,
  headlineLine1,
  headlineAccent,
  subtext,
}: StitchServicesProps) {
  const cards =
    catalogItems && catalogItems.length > 0
      ? catalogItems.map(catalogItemToCard)
      : services && services.length > 0
        ? services.map(toCard)
        : DEFAULT_SERVICES;

  const displayEyebrow = eyebrow || 'Specialist Autobody Divisions';
  const displayLine1 = headlineLine1 || 'From Damage To';
  const displayAccent = headlineAccent || 'Showroom Finish.';
  const displaySubtext =
    subtext ||
    'Comprehensive bodywork, structural restoration and cosmetic refinement using factory-approved techniques.';

  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(Math.max(1, Math.ceil(cards.length / 4)));

  // One "page" = one viewport of cards (4 on desktop, 2 on tablet, 1 on mobile).
  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = el.clientWidth + gap;
    const total = Math.max(1, Math.ceil((el.scrollWidth + gap) / step - 0.01));
    const maxScroll = el.scrollWidth - el.clientWidth;
    const current = el.scrollLeft >= maxScroll - 2 ? total : Math.min(total, Math.round(el.scrollLeft / step) + 1);
    setPageCount(total);
    setPage(current);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [measure, cards.length]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (el.clientWidth + gap), behavior: 'smooth' });
  };

  const atStart = page <= 1;
  const atEnd = page >= pageCount;
  const progress = (page / pageCount) * 100;

  return (
    <section id='services' className='bg-[#111113]'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:gap-16 lg:px-12 xl:px-0 xl:py-[120px]'>
        {/* Header */}
        <div className='flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
          <div className='flex flex-col items-start gap-5'>
            <span className='flex items-center gap-2.5 rounded-full border border-[#2a2a30] bg-[#1b1b20] py-[7px] pr-4 pl-3.5'>
              <img src={DOT_SRC} alt='' width={6} height={6} className='size-1.5 shrink-0' />
              <span className='font-[family-name:var(--font-inter)] text-[11px] leading-normal font-normal tracking-[0.44px] whitespace-nowrap text-[#c6c6c6] uppercase'>
                {displayEyebrow}
              </span>
            </span>
            <h2 className='max-w-[474px] font-[family-name:var(--font-manrope)] text-[32px] leading-[38px] font-extrabold tracking-[-0.64px] text-white uppercase sm:text-[40px] sm:leading-[46px] lg:text-[48px] lg:leading-[54px] lg:tracking-[-0.96px]'>
              {displayLine1} <span className='text-[#dc2626]'>{displayAccent}</span>
            </h2>
          </div>
          <p className='max-w-[440px] font-[family-name:var(--font-inter)] text-base leading-[26px] font-normal text-[#b5b5b5]'>
            {displaySubtext}
          </p>
        </div>

        {/* Slider */}
        <div className='flex flex-col gap-5'>
          <div
            ref={trackRef}
            data-process-track
            role='region'
            aria-roledescription='carousel'
            aria-label='Services'
            className='flex snap-x snap-mandatory [scrollbar-width:none] gap-5 overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden'
          >
            {cards.map((card) => (
              <article
                key={card.key}
                className='group flex min-h-[351px] w-[85%] shrink-0 snap-start flex-col justify-between rounded-2xl border border-[#2a2a30] bg-[#1b1b20] p-7 transition-colors duration-300 hover:border-[#dc2626]/60 sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]'
              >
                <div className='flex flex-col items-start gap-5 pb-6'>
                  <div className='flex w-full items-center justify-between'>
                    <div className='flex items-center justify-center rounded-xl bg-white p-3 transition-transform duration-300 group-hover:scale-105'>
                      {card.iconSrc ? (
                        <Image src={card.iconSrc} alt='' width={24} height={24} className='size-6' />
                      ) : card.icon.kind === 'figma' ? (
                        <span className='relative block size-6 shrink-0 overflow-hidden'>
                          <span className={`absolute flex items-center justify-center ${card.icon.icon.inset}`}>
                            <img
                              src={card.icon.icon.src}
                              alt=''
                              width={card.icon.icon.width}
                              height={card.icon.icon.height}
                              className='block max-w-none'
                            />
                          </span>
                        </span>
                      ) : (
                        <card.icon.icon className='size-6 text-[#111113]' />
                      )}
                    </div>
                    {card.badge && (
                      <span className='rounded-full border border-[#2a2a30] px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] leading-normal tracking-[0.4px] text-[#c6c6c6] uppercase'>
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h3 className='font-[family-name:var(--font-manrope)] text-xl leading-[26px] font-bold tracking-[-0.1px] text-white'>
                    {card.name}
                  </h3>
                  <p className='font-[family-name:var(--font-inter)] text-sm leading-[22px] font-normal text-[#b5b5b5]'>
                    {card.description}
                  </p>
                </div>

                <div className='flex items-center justify-between gap-3 border-t border-[#2a2a30] pt-4'>
                  <span className='font-[family-name:var(--font-inter)] text-[10px] leading-normal font-normal tracking-[0.4px] text-[#c6c6c6] uppercase'>
                    {card.footnote}
                  </span>
                  <a
                    href='#estimator'
                    className='flex shrink-0 items-center gap-0.5 rounded font-[family-name:var(--font-inter)] text-xs leading-normal font-semibold text-[#dc2626] transition-colors hover:text-[#f0605f] focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:outline-none'
                  >
                    Quote
                    <span className='relative block size-6 shrink-0 overflow-hidden transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5'>
                      <span className='absolute inset-[27.08%] flex items-center justify-center'>
                        <img src={ARROW_UR_SRC} alt='' width={12.5} height={12.5} className='block max-w-none' />
                      </span>
                    </span>
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Slider controls */}
          <div className='flex items-center justify-between pt-5'>
            <div className='flex items-center gap-5'>
              <p
                aria-live='polite'
                className='font-[family-name:var(--font-inter)] text-xs leading-normal font-medium tracking-[0.96px] whitespace-nowrap text-[#b5b5b5]'
              >
                {pad(page)} / {pad(pageCount)}
              </p>
              <div className='relative h-0.5 w-[120px] overflow-hidden bg-[#2a2a30] sm:w-40'>
                <div
                  className='absolute top-0 left-0 h-0.5 bg-linear-to-r from-[#dc2626] via-[#f0605f] via-60% to-[#ffd9d9] transition-[width] duration-300'
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <button
                type='button'
                onClick={() => scrollByPage(-1)}
                disabled={atStart}
                aria-label='Previous services'
                className='flex size-[52px] items-center justify-center rounded-[26px] border border-[#2a2a30] bg-[#1b1b20] transition hover:border-[#dc2626] focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35'
              >
                <span className='relative block size-6 rotate-180 overflow-hidden'>
                  <span className='absolute inset-y-1/4 right-[37.5%] left-[37.5%] flex items-center justify-center'>
                    <img src={ARROW_SRC} alt='' width={7.50005} height={13.5001} className='block max-w-none' />
                  </span>
                </span>
              </button>
              <button
                type='button'
                onClick={() => scrollByPage(1)}
                disabled={atEnd}
                aria-label='Next services'
                className='flex size-[52px] items-center justify-center rounded-[26px] border border-[#2a2a30] bg-[#1b1b20] transition hover:border-[#dc2626] focus-visible:ring-2 focus-visible:ring-[#dc2626] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35'
              >
                <span className='relative block size-6 overflow-hidden'>
                  <span className='absolute inset-y-1/4 right-[37.5%] left-[37.5%] flex items-center justify-center'>
                    <img src={ARROW_SRC} alt='' width={7.50005} height={13.5001} className='block max-w-none' />
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
