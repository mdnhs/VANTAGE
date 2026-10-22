import Image from 'next/image';
import { BadgeCheck, Crosshair, SprayCan, type LucideIcon } from 'lucide-react';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';
import { ABOUT_FALLBACK_IMAGES, type AboutStandard } from '@/features/about-page/defaults';
import {
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';

// Icons are fixed by position (alignment, spray booth, NCT); only the title/description text is
// CMS-driven. No Figma equivalents exist, so lucide icons sit in the homepage's white icon tile.
const ICONS: LucideIcon[] = [Crosshair, SprayCan, BadgeCheck];

interface StandardsSectionProps {
  eyebrow: string;
  title: string;
  image: PublicImage | null;
  items: AboutStandard[];
}

// Last word of the CMS title becomes the red accent; the CMS newline is folded into a space.
function splitAccent(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { head: title, accent: undefined };
  return { head: words.slice(0, -1).join(' '), accent: words[words.length - 1] };
}

export function StandardsSection({ eyebrow, title, image, items }: StandardsSectionProps) {
  const { head, accent } = splitAccent(title);

  return (
    <section className={`w-full ${SECTION_BG.raised} ${SECTION_PADDING}`}>
      <div className={`${SECTION_CONTAINER} grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20`}>
        <div className='relative h-[260px] w-full overflow-hidden rounded-[20px] border border-[#2a2a30] bg-black sm:h-[380px] lg:h-[600px]'>
          <Image
            src={image ? sizedSrc(image, 'w_1200') : ABOUT_FALLBACK_IMAGES.standards}
            alt='Vantage Autobody facility'
            fill
            sizes='(min-width: 1024px) 560px, 100vw'
            className='object-cover'
          />
        </div>

        <div className='flex flex-col gap-10'>
          <SectionHeader eyebrow={eyebrow} title={head} accent={accent} />

          <div className='flex flex-col gap-4'>
            {items.map((item, index) => {
              const Icon = ICONS[index % ICONS.length];
              return (
                <article
                  key={`${item.title}-${index}`}
                  className='group flex gap-5 rounded-2xl border border-[#2a2a30] bg-[#1b1b20] p-6 transition-colors duration-300 hover:border-[#dc2626]/60'
                >
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-white transition-transform duration-300 group-hover:scale-105'>
                    <Icon aria-hidden className='size-6 text-[#111113]' />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <h3 className='font-[family-name:var(--font-manrope)] text-xl leading-[26px] font-bold tracking-[-0.1px] text-white'>
                      {item.title}
                    </h3>
                    <p className='font-[family-name:var(--font-inter)] text-sm leading-[22px] text-[#b5b5b5]'>
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
