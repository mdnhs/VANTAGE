import { TiltArticle } from '@/components/marketing/ui/tilt-article';
import { CarFront, FileText, MessagesSquare, type LucideIcon } from 'lucide-react';
import {
  CARD,
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';

// Icons are fixed by position (no Figma equivalent, so lucide in the Figma white icon tile);
// only the title/description text is CMS-driven.
const ICONS: LucideIcon[] = [MessagesSquare, CarFront, FileText];

const pad = (n: number) => String(n).padStart(2, '0');

// Last word of the CMS title becomes the red accent, matching the homepage headings.
function splitAccent(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { head: title, accent: undefined };
  return { head: words.slice(0, -1).join(' '), accent: words[words.length - 1] };
}

interface CoordinationSectionProps {
  title: string;
  subtext: string;
  features: { title: string; description: string }[];
}

export function CoordinationSection({ title, subtext, features }: CoordinationSectionProps) {
  const { head, accent } = splitAccent(title);

  return (
    <section className={SECTION_BG.raised}>
      <div className={`${SECTION_CONTAINER} ${SECTION_PADDING} gap-12 max-sm:gap-7 max-sm:px-5 max-sm:py-14 lg:gap-16`}>
        <SectionHeader eyebrow='Claims Concierge' title={head} accent={accent} intro={subtext} />

        <div className='grid grid-cols-1 gap-7 sm:gap-5 md:grid-cols-3'>
          {features.map((feature, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <TiltArticle
                key={`${feature.title}-${index}`}
                className={`group grid grid-cols-[40px_1fr] items-start gap-x-3.5 gap-y-1 p-[18px] transition-colors duration-300 hover:border-brand/60 sm:flex sm:flex-col sm:items-stretch sm:gap-5 sm:p-7 ${CARD}`}
              >
                <div className='contents'>
                  <div className='row-span-2 flex items-center justify-center rounded-xl bg-[#f1f3f6] p-2.5 transition-transform duration-300 group-hover:scale-105 sm:order-1 sm:row-span-1 sm:w-fit sm:p-3'>
                    <Icon className='size-5 text-[#1b1f26] sm:size-6' aria-hidden />
                  </div>
                  <span className='col-start-2 row-start-1 font-site-heading text-[13px] leading-normal font-extrabold text-brand sm:order-2 sm:-mb-2.5 sm:font-site-body sm:text-[11px] sm:font-semibold sm:tracking-[0.88px] sm:text-brand sm:uppercase'>
                    {pad(index + 1)}
                  </span>
                </div>
                <div className='col-start-2 row-start-2 flex min-w-0 flex-col gap-1 sm:order-3 sm:gap-2.5'>
                  <h3 className='font-site-body text-base leading-normal font-semibold text-[#f1f3f6] sm:font-site-heading sm:text-xl sm:leading-[26px] sm:font-bold sm:tracking-[-0.1px]'>
                    {feature.title}
                  </h3>
                  <p className='font-site-body text-sm leading-[21px] text-[#a4abb6] sm:leading-[22px] sm:text-[#b9bfc9]'>
                    {feature.description}
                  </p>
                </div>
              </TiltArticle>
            );
          })}
        </div>
      </div>
    </section>
  );
}
