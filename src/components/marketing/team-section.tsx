import { ClipReveal } from '@/components/marketing/ui/reveal';
import { TiltArticle } from '@/components/marketing/ui/tilt-article';
import Image from 'next/image';
import { sizedSrc } from '@/lib/media/public-image';
import { ABOUT_FALLBACK_IMAGES, type AboutPageTeamMember } from '@/features/about-page/content';
import { ScrollDots } from '@/components/marketing/scroll-dots';
import { SectionHeader } from '@/components/marketing/ui/landing-primitives';

// Mobile (Figma 390px) uses 20px gutters and 56px section padding; sm: and up match the shared tokens.
const MOBILE_CONTAINER = 'mx-auto flex w-full max-w-[1200px] flex-col px-5 sm:px-6 lg:px-12 xl:px-0';
const MOBILE_PADDING = 'py-14 sm:py-24 xl:py-[120px]';

interface TeamSectionProps {
  title: string;
  subtext: string;
  members: AboutPageTeamMember[];
}

// Last word of the CMS title becomes the red accent, matching the homepage headings.
function splitAccent(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { head: title, accent: undefined };
  return { head: words.slice(0, -1).join(' '), accent: words[words.length - 1] };
}

export function TeamSection({ title, subtext, members }: TeamSectionProps) {
  const { head, accent } = splitAccent(title);

  return (
    <section className={`w-full bg-[#20252d] ${MOBILE_PADDING}`}>
      <div className={`${MOBILE_CONTAINER} gap-6 sm:gap-12 lg:gap-16`}>
        <SectionHeader eyebrow='Our People' title={head} accent={accent} intro={subtext} />

        <div
          id='team-carousel'
          className='-mx-5 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-3 overflow-x-auto px-5 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden'
        >
          {members.map((member, index) => {
            const photo = member.image
              ? sizedSrc(member.image, 'w_800,h_946,c_fill,g_face')
              : (ABOUT_FALLBACK_IMAGES.team[index] ?? null);
            const focal = member.image?.id ? member.image.focal : null;

            return (
              <TiltArticle
                key={`${member.name}-${index}`}
                className='group flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-[18px] border border-[#353c47] bg-[#262b34] transition-colors hover:border-brand/50 sm:w-auto sm:rounded-[20px]'
              >
                <ClipReveal className='relative h-[280px] w-full shrink-0 overflow-hidden bg-black sm:h-[380px] lg:h-[400px]'>
                  {photo && (
                    <Image
                      src={photo}
                      alt={member.name}
                      fill
                      sizes='(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw'
                      style={focal ? { objectPosition: `${focal.x * 100}% ${focal.y * 100}%` } : undefined}
                      className='object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0'
                    />
                  )}
                  <div className='absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(38,43,52,0)_0%,#1b1b20_100%)]' />
                </ClipReveal>

                <div className='flex flex-col items-start gap-1 p-4 sm:gap-1.5 sm:p-6'>
                  <span className='font-site-body text-[11px] leading-normal tracking-[0.88px] text-brand uppercase'>
                    {member.role}
                  </span>
                  <h3 className='font-site-heading text-[17px] leading-normal font-semibold tracking-[-0.11px] text-[#f1f3f6] sm:text-[22px] sm:leading-7 sm:font-bold'>
                    {member.name}
                  </h3>
                </div>
              </TiltArticle>
            );
          })}
        </div>
        <ScrollDots targetId='team-carousel' count={members.length} />
      </div>
    </section>
  );
}
