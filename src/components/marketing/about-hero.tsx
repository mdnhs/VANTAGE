import Image from 'next/image';
import { cldUrl } from '@/lib/cloudinary/url';
import { ABOUT_FALLBACK_IMAGES } from '@/features/about-page/defaults';

interface AboutHeroProps {
  eyebrow: string;
  line1: string;
  accent1: string;
  line2: string;
  accent2: string;
  imagePublicId: string | null;
}

export function AboutHero({ eyebrow, line1, accent1, line2, accent2, imagePublicId }: AboutHeroProps) {
  return (
    <section className='relative container mx-auto flex min-h-[360px] items-end overflow-hidden px-4 pt-28 pb-12 sm:min-h-[400px] sm:px-6 sm:pt-32 sm:pb-16 lg:min-h-[480px] lg:px-12'>
      <div className='absolute inset-0 z-0'>
        <Image
          src={imagePublicId ? cldUrl(imagePublicId, { width: 1920 }) : ABOUT_FALLBACK_IMAGES.hero}
          alt='Vantage Autobody workshop'
          fill
          priority
          className='object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-[#131313] via-[rgba(19,19,19,0.8)] via-50% to-transparent' />
      </div>

      <div className='relative z-10 flex motion-preset-slide-up flex-col gap-4 motion-duration-700 sm:gap-6'>
        <div className='flex items-center gap-4 opacity-80'>
          <span className='h-px w-12 bg-red-500' />
          <span className='text-xs font-semibold tracking-[1.2px] text-red-500 uppercase'>{eyebrow}</span>
        </div>

        <h1 className='xs:text-4xl max-w-[896px] font-[family-name:var(--font-manrope)] text-3xl leading-tight font-extrabold tracking-tight text-[#e5e2e1] sm:text-5xl sm:leading-[1.2] lg:text-[64px] lg:leading-[80px]'>
          {line1} <span className='text-[#dc2626]'>{accent1}</span>.
          <br />
          {line2} <span className='text-[#c4c7ca]'>{accent2}</span>.
        </h1>
      </div>
    </section>
  );
}
