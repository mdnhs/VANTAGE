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
      <div className={`${SECTION_CONTAINER} ${SECTION_PADDING} gap-12 lg:gap-16`}>
        <SectionHeader eyebrow='Claims Concierge' title={head} accent={accent} intro={subtext} />

        <div className='grid grid-cols-1 gap-5 md:grid-cols-3'>
          {features.map((feature, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <article
                key={`${feature.title}-${index}`}
                className={`group flex flex-col justify-between gap-10 p-7 transition-colors duration-300 hover:border-brand/60 sm:p-8 ${CARD}`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center justify-center rounded-xl bg-white p-3 transition-transform duration-300 group-hover:scale-105'>
                    <Icon className='size-6 text-[#111113]' aria-hidden />
                  </div>
                  <span className='font-site-body text-[10px] leading-normal tracking-[0.4px] text-[#737373] uppercase'>
                    {pad(index + 1)}
                  </span>
                </div>
                <div className='flex flex-col gap-3'>
                  <h3 className='font-site-heading text-xl leading-[26px] font-bold tracking-[-0.1px] text-white'>
                    {feature.title}
                  </h3>
                  <p className='font-site-body text-sm leading-[22px] text-[#b5b5b5]'>{feature.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
