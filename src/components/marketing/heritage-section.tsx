import Image from 'next/image';
import { Quote } from 'lucide-react';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';
import { ABOUT_FALLBACK_IMAGES } from '@/features/about-page/defaults';
import {
  BODY_TEXT,
  CARD,
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';

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
    <section className={`w-full ${SECTION_BG.raised} ${SECTION_PADDING}`}>
      <div className={`${SECTION_CONTAINER} grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-6`}>
        <div className='flex flex-col gap-8 lg:col-span-5'>
          <SectionHeader eyebrow='Who We Are' title={head} accent={accent} />
          <p className={BODY_TEXT}>{text}</p>

          <dl className='grid grid-cols-2 gap-4'>
            {[stat1, stat2].map((stat, index) => (
              <div key={index} className={`${CARD} flex flex-col-reverse justify-end gap-2 p-5 sm:p-6`}>
                <dt className='font-site-body text-[11px] leading-normal tracking-[0.88px] text-[#a1a1a1] uppercase'>
                  {stat.label}
                </dt>
                <dd
                  className={`font-site-heading text-[32px] leading-[38px] font-extrabold tracking-[-0.64px] sm:text-[40px] sm:leading-[46px] ${index === 0 ? 'text-brand' : 'text-white'}`}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className='flex flex-col lg:col-span-6 lg:col-start-7'>
          <div className='relative h-[280px] w-full overflow-hidden rounded-[20px] border border-[#2a2a30] bg-black sm:h-[400px] lg:h-[500px]'>
            <Image
              src={image ? sizedSrc(image, 'w_1200') : ABOUT_FALLBACK_IMAGES.heritage}
              alt='Craftsman working on vehicle bodywork'
              fill
              sizes='(min-width: 1024px) 600px, 100vw'
              className='object-cover'
            />
          </div>

          <figure className='relative mx-3 -mt-10 flex flex-col gap-4 rounded-2xl border border-[#2a2a30] bg-[#1b1b20]/90 p-6 backdrop-blur-md sm:mx-8 sm:-mt-16 sm:p-7'>
            <span className='flex size-11 items-center justify-center rounded-xl bg-white'>
              <Quote aria-hidden className='size-5 fill-brand text-brand' />
            </span>
            <blockquote className='font-site-body text-base leading-[26px] text-[#c6c6c6] italic'>
              &ldquo;{quote}&rdquo;
            </blockquote>
          </figure>
        </div>
      </div>
    </section>
  );
}
