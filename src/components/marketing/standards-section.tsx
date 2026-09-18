import Image from 'next/image';
import { cldUrl } from '@/lib/cloudinary/url';
import { ABOUT_FALLBACK_IMAGES, type AboutStandard } from '@/features/about-page/defaults';

// Icons are fixed by position; only the title/description text is CMS-driven.
const ICONS = [
  '/assets/marketing/icon-standard-alignment.svg',
  '/assets/marketing/icon-standard-spraybooth.svg',
  '/assets/marketing/icon-standard-nct.svg',
];

interface StandardsSectionProps {
  eyebrow: string;
  title: string;
  imagePublicId: string | null;
  items: AboutStandard[];
}

export function StandardsSection({ eyebrow, title, imagePublicId, items }: StandardsSectionProps) {
  return (
    <section className='container mx-auto grid grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-[120px] lg:px-12 lg:py-[120px]'>
      <div className='intersect-once relative h-[260px] w-full overflow-hidden rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] sm:h-[380px] lg:h-[600px] intersect:motion-preset-slide-right'>
        <Image
          src={imagePublicId ? cldUrl(imagePublicId, { width: 1200 }) : ABOUT_FALLBACK_IMAGES.standards}
          alt='Vantage Autobody facility'
          fill
          className='object-cover'
        />
      </div>

      <div className='intersect-once flex flex-col gap-8 intersect:motion-preset-slide-left'>
        <div className='flex items-center gap-4 opacity-80'>
          <span className='text-xs font-semibold tracking-[1.2px] text-[#c4c7ca] uppercase'>{eyebrow}</span>
          <span className='h-px w-12 bg-[#c4c7ca]' />
        </div>

        <h2 className='font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight whitespace-pre-line text-[#e5e2e1] uppercase sm:text-3xl lg:text-[40px] lg:leading-[48px]'>
          {title}
        </h2>

        <div className='flex flex-col gap-6'>
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className='group flex gap-4 sm:gap-6'>
              <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-[#201f1f] group-hover:motion-preset-pop sm:size-12'>
                <Image
                  src={ICONS[index % ICONS.length]}
                  alt=''
                  width={22}
                  height={22}
                  className='size-5 sm:size-[22px]'
                />
              </div>
              <div className='flex flex-col gap-1.5 sm:gap-2'>
                <h3 className='font-[family-name:var(--font-manrope)] text-xl font-semibold text-[#e5e2e1] sm:text-2xl'>
                  {item.title}
                </h3>
                <p className='text-sm leading-relaxed text-neutral-400 sm:text-base sm:leading-6'>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
