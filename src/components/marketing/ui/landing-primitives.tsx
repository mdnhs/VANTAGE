/* eslint-disable @next/next/no-img-element */
import { RevealContent } from './reveal-content';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, type ComponentProps, type ReactNode } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { PUBLIC_PAGES, type PublicPageId } from '@/lib/seo/public-pages';
import type { PublicImage } from '@/lib/media/public-image';

// Shared building blocks of the Figma landing design (file xOrMQXOlfhZP8QQu4mScLw, frame 131:3),
// so inner marketing pages speak the same visual language as the homepage. Values mirror the
// homepage sections exactly — change them here, not per page.

const DOT_SRC = '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg';
const ARROW_SRC = '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg';

export const SECTION_CONTAINER = 'mx-auto flex w-full max-w-[1200px] flex-col px-5 sm:px-6 lg:px-12 xl:px-0';
export const SECTION_PADDING = 'py-12 sm:py-24 xl:py-[120px]';
// Alternating section backgrounds used down the homepage.
export const SECTION_BG = { base: 'bg-[#1b1f26]', raised: 'bg-[#20252d]' } as const;
export const CARD = 'rounded-[18px] sm:rounded-2xl border border-[#353c47] bg-[#262b34]';
export const BODY_TEXT = 'font-site-body text-base leading-[1.55] sm:leading-[26px] text-[#b9bfc9]';

export function Eyebrow({ children, tone = 'section' }: { children: ReactNode; tone?: 'section' | 'hero' }) {
  const surface =
    tone === 'hero' ? 'border-[#353c47] bg-[#2e343e] sm:bg-[#262b34]' : 'border-[#353c47] bg-[#2e343e] sm:bg-[#262b34]';
  return (
    <span
      className={`inline-flex w-fit max-w-full items-center gap-2.5 rounded-full border py-1.5 pr-3 pl-2.5 sm:py-[7px] sm:pr-4 sm:pl-3.5 ${surface}`}
    >
      <img src={DOT_SRC} alt='' width={6} height={6} className='size-1.5 shrink-0' />
      <span
        className={`font-site-body text-[11px] leading-normal font-medium tracking-[0.06em] text-[#c9ced6] uppercase sm:font-normal sm:tracking-[0.44px]`}
      >
        {children}
      </span>
    </span>
  );
}

interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  intro?: ReactNode;
  /** Right-hand slot on desktop (e.g. slider arrows) shown instead of / beside the intro. */
  aside?: ReactNode;
  align?: 'split' | 'center';
  as?: 'h1' | 'h2';
}

// Eyebrow + uppercase Manrope heading (accent words in red) with the intro paragraph pushed to
// the right on desktop — the header pattern of Services / Results / Reviews in Figma.
export function SectionHeader({
  eyebrow,
  title,
  accent,
  intro,
  aside,
  align = 'split',
  as: Tag = 'h2',
}: SectionHeaderProps) {
  const centered = align === 'center';
  return (
    <div
      className={
        centered
          ? 'flex flex-col items-center gap-3.5 text-center sm:gap-5'
          : 'flex flex-col items-start justify-between gap-3.5 sm:gap-6 md:flex-row md:items-end'
      }
    >
      <div className={`flex flex-col gap-3.5 sm:gap-5 ${centered ? 'items-center' : 'items-start'}`}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Tag className='max-w-[560px] font-site-heading text-[30px] leading-[1.08] font-extrabold tracking-[-0.3px] text-[#f1f3f6] uppercase sm:text-[40px] sm:leading-[46px] sm:tracking-[-0.64px] lg:text-[48px] lg:leading-[54px] lg:tracking-[-0.96px]'>
          {title}
          {accent && (
            <>
              {' '}
              <span className='text-brand'>{accent}</span>
            </>
          )}
        </Tag>
        {centered && intro && <p className={`max-w-[620px] ${BODY_TEXT}`}>{intro}</p>}
      </div>
      {!centered && (intro || aside) && (
        <div className='flex flex-col items-start gap-3.5 sm:gap-6 md:items-end'>
          {intro && <p className={`max-w-[440px] ${BODY_TEXT}`}>{intro}</p>}
          {aside}
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <span className='flex size-6 shrink-0 items-center justify-center transition-transform group-hover:translate-x-1'>
      <img src={ARROW_SRC} alt='' width={7.5} height={13.5} className='max-w-none' />
    </span>
  );
}

const BUTTON_BASE =
  'group flex w-full items-center justify-center gap-2.5 sm:inline-flex sm:w-auto min-h-[52px] rounded-[12px] font-site-body text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-[#f1f3f6] uppercase transition-colors sm:min-h-0 sm:rounded-[8px] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1f26] focus-visible:outline-none';
export const BUTTON_PRIMARY = `${BUTTON_BASE} border border-brand bg-brand py-[15px] pr-[21px] pl-[23px] shadow-[0_8px_14px_rgb(var(--brand-rgb)/0.35)] hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60`;
export const BUTTON_SECONDARY = `${BUTTON_BASE} border border-[#3e4551] bg-[#2e343e] px-6 py-4 sm:bg-[#20252d] hover:border-brand hover:bg-[#262b34]`;

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  arrow?: boolean;
};

export function ButtonLink({
  variant = 'primary',
  icon,
  arrow = variant === 'primary',
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-reveal-button
      {...props}
      className={`relative overflow-hidden ${variant === 'primary' ? BUTTON_PRIMARY : BUTTON_SECONDARY} ${className}`}
    >
      <RevealContent band={variant === 'primary' ? 'dark' : 'brand'} className='gap-2.5'>
        {icon}
        <span>{children}</span>
        {arrow && <Arrow />}
      </RevealContent>
    </Link>
  );
}

interface PageHeroProps {
  eyebrow: ReactNode;
  /** Each entry renders on its own line; the last one is the red accent line. */
  lines: ReactNode[];
  subtext?: ReactNode;
  imageSrc?: string | null;
  imageAlt?: string;
  /** Plays over the photo when set; the photo stays as its poster while it loads. */
  video?: PublicImage | null;
  /** Renders a Home › page breadcrumb above the copy, matching PageJsonLd's BreadcrumbList. */
  page?: Exclude<PublicPageId, 'home'>;
  /** A child of `page` (e.g. one service): the page becomes a link and this is the last crumb. */
  current?: string;
  children?: ReactNode;
}

const CRUMB_LINK = 'transition-colors hover:text-[#f1f3f6]';

function HeroBreadcrumb({ page, current }: { page: Exclude<PublicPageId, 'home'>; current?: string }) {
  // The short crumb name, not the (keyword-led) page title.
  const { crumb: title, path } = PUBLIC_PAGES[page];
  return (
    <Breadcrumb className='mb-3.5 sm:mb-6 lg:mb-7'>
      <BreadcrumbList className='font-site-body text-[13px] font-medium text-[#a4abb6] sm:text-[#a4abb6]'>
        <BreadcrumbItem>
          {/* Plain Link, not BreadcrumbLink: its useRender hook can't run in this server component */}
          <Link href='/' className={CRUMB_LINK}>
            Home
          </Link>
        </BreadcrumbItem>
        <BreadcrumbSeparator className='text-[#525a67]' />
        <BreadcrumbItem>
          {current ? (
            <Link href={path} className={CRUMB_LINK}>
              {title}
            </Link>
          ) : (
            <BreadcrumbPage className='text-[#f1f3f6]'>{title}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {current && (
          <>
            <BreadcrumbSeparator className='text-[#525a67]' />
            <BreadcrumbItem>
              <BreadcrumbPage className='text-[#d5d9e0] sm:text-[#f1f3f6]'>{current}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Inner-page version of the homepage hero (131:23): same shade + fade-to-page treatment and
// type scale, shorter. `data-hero-copy` is the hook PageAnimations uses for the intro timeline.
export function PageHero({
  eyebrow,
  lines,
  subtext,
  imageSrc,
  imageAlt = '',
  video,
  page,
  current,
  children,
}: PageHeroProps) {
  const accentIndex = lines.length - 1;
  const hasMedia = Boolean(imageSrc || video);
  return (
    // With a photo or video behind it the hero fills the screen below the sticky header (73px on
    // phones, 97px from sm up; svh holds steady while a phone's address bar shows or hides). On
    // phones the copy sits at the bottom so the media shows above it. Without media it keeps its
    // natural height: a full screen of plain dark would only look empty.
    <section
      className={`relative flex w-full flex-col overflow-hidden bg-[#1b1f26] ${
        hasMedia ? 'sm:min-h-[calc(100svh-97px)]' : ''
      }`}
    >
      {hasMedia && (
        <div className='absolute inset-x-0 top-0 h-[300px] overflow-hidden sm:inset-0 sm:h-auto'>
          {video ? (
            <video
              data-hero-media
              autoPlay
              muted
              loop
              playsInline
              poster={imageSrc ?? undefined}
              className='h-full w-full object-cover object-[68%_50%] sm:object-center'
            >
              <source src={video.src} type={video.mimeType ?? 'video/mp4'} />
            </video>
          ) : (
            imageSrc && (
              <Image
                data-hero-media
                src={imageSrc}
                alt={imageAlt}
                fill
                priority
                sizes='100vw'
                className='object-cover object-[68%_50%] sm:object-center'
              />
            )
          )}
          {/* Shade: top to bottom on phones, where the copy sits low and spans the width; left to right from sm up */}
          <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(27,31,38,0.35)_0%,rgba(27,31,38,0.45)_50%,#1b1f26_100%)] sm:hidden' />
          <div className='absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(27,31,38,0.9)_0%,rgba(27,31,38,0.75)_40%,rgba(27,31,38,0.3)_62%,rgba(27,31,38,0.1)_100%)] sm:block' />
          <div className='absolute inset-x-0 bottom-0 hidden h-[200px] bg-[linear-gradient(180deg,rgba(27,31,38,0)_0%,rgba(27,31,38,0.45)_50%,#1b1f26_100%)] sm:block' />
        </div>
      )}
      <div
        className={`relative z-10 mx-auto flex w-full max-w-[1200px] grow flex-col px-5 ${hasMedia ? 'pt-[200px]' : 'pt-10'} pb-10 sm:justify-center sm:px-6 sm:pt-28 sm:pb-20 lg:px-12 lg:pt-32 lg:pb-[120px] xl:px-0`}
      >
        {/* Outside data-hero-copy: PageAnimations reads that block's children as [eyebrow, heading, ...] */}
        {page && <HeroBreadcrumb page={page} current={current} />}
        <div
          data-hero-copy
          className='flex w-full max-w-[760px] flex-col items-start gap-3.5 sm:gap-6 lg:max-w-none lg:gap-7'
        >
          <Eyebrow tone='hero'>{eyebrow}</Eyebrow>
          <h1 className='font-site-heading text-[clamp(30px,9.23vw,36px)] leading-[1.04] font-extrabold tracking-[-0.02em] uppercase sm:text-[56px] sm:leading-[1.05] sm:tracking-[-0.03em] lg:text-[76px] lg:leading-[80px]'>
            {lines.map((line, index) => (
              <Fragment key={index}>
                {/* Each line is its own block, so the space is invisible but keeps the words apart
                    for crawlers, SEO tools and screen readers ("Repair" + "& Respray"). */}
                {index > 0 ? ' ' : null}
                <span
                  className={`block ${index === accentIndex && lines.length > 1 ? 'text-brand' : 'text-[#f1f3f6]'}`}
                >
                  {line}
                </span>
              </Fragment>
            ))}
          </h1>
          {subtext && (
            <p className='max-w-[600px] font-site-body text-[16px] leading-[1.55] text-[#c9ced6] sm:text-[18px] sm:leading-[29px] sm:text-[#d5d9e0] lg:max-w-[620px]'>
              {subtext}
            </p>
          )}
          {children && (
            <div className='flex w-full flex-col gap-[10px] max-sm:mt-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3 lg:pt-1'>
              {children}
            </div>
          )}
        </div>
        {/* Scroll cue under a full-screen hero (PageAnimations draws the line and fades it on scroll) */}
        {hasMedia && (
          <div
            data-scroll-cue
            aria-hidden='true'
            className='pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex [@media(max-height:760px)]:hidden'
          >
            <span className='font-site-body text-[10px] tracking-[0.2em] text-white/55 uppercase'>Scroll</span>
            <span className='relative block h-9 w-px overflow-hidden bg-white/15'>
              <span data-cue-line className='absolute inset-0 block bg-white/70' />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
