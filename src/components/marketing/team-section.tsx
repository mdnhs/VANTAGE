import Image from 'next/image';
import { cldUrl } from '@/lib/cloudinary/url';
import { ABOUT_FALLBACK_IMAGES, type AboutTeamMember } from '@/features/about-page/defaults';
import {
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';

interface TeamSectionProps {
  title: string;
  subtext: string;
  members: AboutTeamMember[];
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
    <section className={`w-full ${SECTION_BG.base} ${SECTION_PADDING}`}>
      <div className={`${SECTION_CONTAINER} gap-12 lg:gap-16`}>
        <SectionHeader eyebrow='Our People' title={head} accent={accent} intro={subtext} />

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {members.map((member, index) => {
            const photo = member.imagePublicId
              ? cldUrl(member.imagePublicId, { width: 800, height: 946, crop: 'fill', gravity: 'face' })
              : (ABOUT_FALLBACK_IMAGES.team[index] ?? null);

            return (
              <article
                key={`${member.name}-${index}`}
                className='group flex flex-col overflow-hidden rounded-2xl border border-[#2a2a30] bg-[#1b1b20] transition-colors hover:border-[#dc2626]/50'
              >
                <div className='relative h-[340px] w-full shrink-0 overflow-hidden bg-black sm:h-[380px] lg:h-[400px]'>
                  {photo && (
                    <Image
                      src={photo}
                      alt={member.name}
                      fill
                      sizes='(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw'
                      className='object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0'
                    />
                  )}
                  <div className='absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(27,27,32,0)_0%,#1b1b20_100%)]' />
                </div>

                <div className='flex flex-col items-start gap-2 p-6'>
                  <span className='font-[family-name:var(--font-inter)] text-[11px] leading-normal tracking-[0.88px] text-[#dc2626] uppercase'>
                    {member.role}
                  </span>
                  <h3 className='font-[family-name:var(--font-manrope)] text-[22px] leading-7 font-bold tracking-[-0.11px] text-white'>
                    {member.name}
                  </h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
