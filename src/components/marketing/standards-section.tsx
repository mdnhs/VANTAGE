import { TiltArticle } from '@/components/marketing/ui/tilt-article';
import { visibleCopy } from '@/lib/features';
import Image from 'next/image';
import { BadgeCheck, Crosshair, SprayCan, type LucideIcon } from 'lucide-react';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';
import { ABOUT_FALLBACK_IMAGES, type AboutStandard } from '@/features/about-page/content';
import { SectionHeader } from '@/components/marketing/ui/landing-primitives';

// Mobile (Figma 390px) uses 20px gutters and 56px section padding; sm: and up match the shared tokens.
const MOBILE_CONTAINER = 'mx-auto flex w-full max-w-[1200px] flex-col px-5 sm:px-6 lg:px-12 xl:px-0';
const MOBILE_PADDING = 'py-14 sm:py-24 xl:py-[120px]';

// Icons are fixed by position (alignment, spray booth, NCT); only the title/description text is
// CMS-driven. No Figma equivalents exist, so lucide icons sit in the homepage's white icon tile.
const ICONS: LucideIcon[] = [Crosshair, SprayCan, BadgeCheck];

interface StandardsSectionProps {
  eyebrow: string;
  title: string;
  image: PublicImage | null;
  items: AboutStandard[];
  insurance?: boolean;
}

// Last word of the CMS title becomes the red accent; the CMS newline is folded into a space.
function splitAccent(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { head: title, accent: undefined };
  return { head: words.slice(0, -1).join(' '), accent: words[words.length - 1] };
}

export function StandardsSection({ eyebrow, title, image, items, insurance = false }: StandardsSectionProps) {
  const { head, accent } = splitAccent(title);

  return (
    <section className={`w-full bg-[#1b1f26] ${MOBILE_PADDING}`}>
      <div
        className={`${MOBILE_CONTAINER} grid grid-cols-1 items-center gap-7 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_560px] xl:gap-[72px]`}
      >
        <div className='relative h-[230px] w-full overflow-hidden rounded-[18px] border border-[#353c47] bg-black max-sm:order-2 sm:h-[380px] sm:rounded-[20px] lg:order-2 lg:h-[520px]'>
          <Image
            src={image ? sizedSrc(image, 'w_1200') : ABOUT_FALLBACK_IMAGES.standards}
            alt='Car body repair facility in Dublin'
            fill
            sizes='(min-width: 1024px) 560px, 100vw'
            className='object-cover'
          />
        </div>

        <div className='flex flex-col gap-7 max-sm:contents sm:gap-10 lg:order-1 lg:gap-6'>
          <div className='max-sm:order-1'>
            <SectionHeader eyebrow={eyebrow} title={head} accent={accent} />
          </div>

          <div className='flex flex-col gap-7 max-sm:order-3 sm:gap-4 lg:gap-6'>
            {items
              .filter((item) => visibleCopy(insurance, item.title, item.description))
              .map((item, index) => {
                const Icon = ICONS[index % ICONS.length];
                return (
                  <TiltArticle
                    key={`${item.title}-${index}`}
                    className='group flex gap-3 transition-colors duration-300 hover:border-brand/60 sm:gap-5 sm:rounded-2xl sm:border sm:border-[#353c47] sm:bg-[#262b34] sm:p-6 lg:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0'
                  >
                    <div className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#055e45] transition-transform duration-300 group-hover:scale-105 sm:size-12 sm:rounded-xl sm:bg-[#f1f3f6] lg:size-7 lg:rounded-full lg:bg-[#055e45]'>
                      <Icon
                        aria-hidden
                        className='size-4 text-[#f1f3f6] sm:size-6 sm:text-[#1b1f26] lg:size-4 lg:text-[#f1f3f6]'
                      />
                    </div>
                    <div className='flex flex-col gap-0.5 sm:gap-2 lg:gap-1'>
                      <h3 className='font-site-heading text-[15px] leading-normal font-semibold tracking-[-0.1px] text-[#f1f3f6] sm:text-xl sm:leading-[26px] sm:font-bold lg:text-base lg:leading-normal lg:font-semibold'>
                        {item.title}
                      </h3>
                      <p className='font-site-body text-sm leading-[21px] text-[#a4abb6] sm:leading-[22px] sm:text-[#b9bfc9] lg:text-[#a4abb6]'>
                        {item.description}
                      </p>
                    </div>
                  </TiltArticle>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}
