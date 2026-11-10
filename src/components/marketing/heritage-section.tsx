import Image from 'next/image';
import { Quote } from 'lucide-react';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';
import { ABOUT_FALLBACK_IMAGES } from '@/features/about-page/content';
import { BODY_TEXT, CARD, SectionHeader } from '@/components/marketing/ui/landing-primitives';

// Mobile (Figma 390px) uses 20px gutters and 56px section padding; sm: and up match the shared tokens.
const MOBILE_CONTAINER = 'mx-auto flex w-full max-w-[1200px] flex-col px-5 sm:px-6 lg:px-12 xl:px-0';
const MOBILE_PADDING = 'py-14 sm:py-24 xl:py-[120px]';

interface HeritageSectionProps {
  title: string;
  text: string;
  stat1: { value: string; label: string };
  stat2: { value: string; label: string };
  image: PublicImage | null;
  quote: string;
}

// Last word of the CMS title becomes the red accent, matching the homepage headings.
function splitAccent(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { head: title, accent: undefined };
  return { head: words.slice(0, -1).join(' '), accent: words[words.length - 1] };
}

export function HeritageSection({ title, text, stat1, stat2, image, quote }: HeritageSectionProps) {
  const { head, accent } = splitAccent(title);

  return (
    <section className={`w-full bg-[#1b1f26] ${MOBILE_PADDING}`}>
      <div
        className={`${MOBILE_CONTAINER} grid grid-cols-1 gap-7 sm:gap-12 lg:grid-cols-[540px_minmax(0,1fr)] lg:content-center lg:items-start lg:gap-x-[72px] lg:gap-y-6`}
      >
        <div className='flex flex-col gap-7 max-sm:contents sm:gap-8 lg:contents'>
          <div className='max-sm:order-2 lg:col-start-2 lg:row-start-1'>
            <SectionHeader eyebrow='Who We Are' title={head} accent={accent} />
          </div>
          <p data-scrub-text className={`${BODY_TEXT} max-sm:order-3 lg:col-start-2 lg:row-start-2`}>
            {text}
          </p>

          <dl className='grid grid-cols-2 gap-2.5 max-sm:order-4 sm:gap-4 lg:col-start-2 lg:row-start-3'>
            {[stat1, stat2].map((stat, index) => (
              <div
                key={index}
                className={`${CARD} flex flex-col-reverse justify-end gap-1 p-4 max-sm:!rounded-[14px] sm:gap-1.5 sm:px-[22px] sm:py-5`}
              >
                <dt className='font-site-body text-[11px] leading-normal tracking-[0.88px] text-[#9aa1ac] uppercase sm:font-semibold sm:text-[#7d8591]'>
                  {stat.label}
                </dt>
                <dd
                  className={`font-site-heading text-[30px] leading-9 font-extrabold tracking-[-0.64px] text-[#f1f3f6] sm:text-[40px] sm:leading-[46px]`}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className='flex flex-col max-sm:contents lg:contents'>
          <div className='relative h-[260px] w-full overflow-hidden rounded-[18px] border border-[#353c47] bg-black max-sm:order-1 sm:h-[400px] sm:rounded-[20px] lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:h-[620px]'>
            <Image
              src={image ? sizedSrc(image, 'w_1200') : ABOUT_FALLBACK_IMAGES.heritage}
              alt='Craftsman working on vehicle bodywork'
              fill
              sizes='(min-width: 1024px) 600px, 100vw'
              className='object-cover'
            />
          </div>

          <figure className='relative mx-3 -mt-10 flex flex-col gap-4 rounded-2xl border border-[#353c47] bg-[#262b34]/90 p-6 backdrop-blur-md max-sm:order-5 max-sm:m-0 max-sm:rounded-none max-sm:border-0 max-sm:border-l-2 max-sm:border-brand max-sm:bg-transparent max-sm:p-0 max-sm:py-1 max-sm:pl-4 max-sm:backdrop-blur-none sm:mx-8 sm:-mt-16 sm:p-7 lg:col-start-2 lg:row-start-4 lg:m-0 lg:gap-3 lg:rounded-none lg:border-0 lg:border-l-2 lg:border-brand lg:bg-transparent lg:p-0 lg:pl-5 lg:backdrop-blur-none'>
            <span className='flex size-11 items-center justify-center rounded-xl bg-[#f1f3f6] max-sm:hidden lg:hidden'>
              <Quote aria-hidden className='size-5 fill-brand text-brand' />
            </span>
            <blockquote className='font-site-body text-base leading-[26px] text-[#c9ced6] italic lg:font-site-heading lg:text-xl lg:leading-[30px] lg:font-bold lg:text-[#f1f3f6] lg:not-italic'>
              &ldquo;{quote}&rdquo;
            </blockquote>
          </figure>
        </div>
      </div>
    </section>
  );
}
