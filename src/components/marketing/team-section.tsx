import Image from 'next/image';
import { cldUrl } from '@/lib/cloudinary/url';
import { ABOUT_FALLBACK_IMAGES, type AboutTeamMember } from '@/features/about-page/defaults';

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150', 'motion-delay-300'];

interface TeamSectionProps {
  title: string;
  subtext: string;
  members: AboutTeamMember[];
}

export function TeamSection({ title, subtext, members }: TeamSectionProps) {
  return (
    <section className='relative container mx-auto overflow-hidden bg-[#1c1b1b] px-4 py-16 sm:px-6 sm:py-20 lg:px-12 lg:py-[120px]'>
      <div className='pointer-events-none absolute inset-y-0 right-0 left-1/2 bg-gradient-to-l from-red-600/10 to-transparent' />

      <div className='relative flex flex-col gap-10 sm:gap-16'>
        <div className='intersect-once flex flex-col gap-4 intersect:motion-preset-slide-up-sm'>
          <h2 className='font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[#e5e2e1] uppercase sm:text-3xl lg:text-[40px] lg:leading-[48px]'>
            {title}
          </h2>
          <p className='max-w-[672px] text-base leading-6 text-neutral-400'>{subtext}</p>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
          {members.map((member, index) => {
            const photo = member.imagePublicId
              ? cldUrl(member.imagePublicId, { width: 800, height: 946, crop: 'fill', gravity: 'face' })
              : (ABOUT_FALLBACK_IMAGES.team[index] ?? null);

            return (
              <div
                key={`${member.name}-${index}`}
                className={`group intersect-once relative h-[360px] overflow-hidden rounded-lg bg-[#131313] shadow-md sm:h-[420px] lg:h-[473px] intersect:motion-preset-slide-up ${STAGGER_DELAY[index % STAGGER_DELAY.length]}`}
              >
                {photo && (
                  <Image
                    src={photo}
                    alt={member.name}
                    fill
                    className='object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0'
                  />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-[rgba(53,53,52,0.9)] via-transparent via-50% to-transparent' />
                <div className='absolute inset-x-6 bottom-6 flex flex-col gap-1'>
                  <span className='font-[family-name:var(--font-manrope)] text-2xl font-semibold text-[#e5e2e1]'>
                    {member.name}
                  </span>
                  <span className='text-xs font-semibold tracking-[1.2px] text-red-500 uppercase'>{member.role}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
