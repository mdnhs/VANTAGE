import Image from 'next/image';
import { cldUrl } from '@/lib/cloudinary/url';
import { ABOUT_FALLBACK_IMAGES } from '@/features/about-page/defaults';

interface HeritageSectionProps {
  title: string;
  text: string;
  stat1: { value: string; label: string };
  stat2: { value: string; label: string };
  imagePublicId: string | null;
  quote: string;
}

export function HeritageSection({ title, text, stat1, stat2, imagePublicId, quote }: HeritageSectionProps) {
  return (
    <section className='container mx-auto grid grid-cols-1 gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-6 lg:px-12 lg:py-[120px]'>
      <div className='intersect-once flex flex-col gap-6 sm:gap-8 lg:col-span-5 intersect:motion-preset-slide-right'>
        <h2 className='font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight text-[#e5e2e1] uppercase sm:text-3xl lg:text-[40px] lg:leading-[48px]'>
          {title}
        </h2>

        <p className='text-base leading-relaxed text-neutral-300 sm:text-lg sm:leading-[1.625]'>{text}</p>

        <div className='flex gap-8 pt-2 sm:gap-12'>
          <div className='flex flex-col gap-2'>
            <span className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[#dc2626] sm:text-4xl'>
              {stat1.value}
            </span>
            <span className='text-xs font-semibold tracking-[1.2px] text-neutral-400 uppercase'>{stat1.label}</span>
          </div>
          <div className='flex flex-col gap-2'>
            <span className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-[#c4c7ca] sm:text-4xl'>
              {stat2.value}
            </span>
            <span className='text-xs font-semibold tracking-[1.2px] text-neutral-400 uppercase'>{stat2.label}</span>
          </div>
        </div>
      </div>

      <div className='intersect-once flex flex-col gap-6 pt-4 sm:pt-14 lg:col-span-6 lg:col-start-7 intersect:motion-preset-slide-left'>
        <div className='relative h-[280px] w-full overflow-hidden rounded-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] sm:h-[400px] lg:h-[500px]'>
          <Image
            src={imagePublicId ? cldUrl(imagePublicId, { width: 1200 }) : ABOUT_FALLBACK_IMAGES.heritage}
            alt='Craftsman working on vehicle bodywork'
            fill
            className='object-cover'
          />
        </div>

        <div className='relative mx-2 -mt-10 flex flex-col gap-4 rounded-xl bg-[#2a2a2a]/40 p-5 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] backdrop-blur-md sm:mx-8 sm:-mt-20 sm:p-8'>
          <Image src='/assets/marketing/icon-quote.svg' alt='' width={30} height={32} className='h-7 w-auto sm:h-8' />
          <p className='text-sm leading-relaxed text-neutral-300 italic sm:text-base sm:leading-6'>
            &quot;{quote}&quot;
          </p>
        </div>
      </div>
    </section>
  );
}
