/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';
import { BODY_TEXT, ButtonLink, CARD } from '@/components/marketing/ui/landing-primitives';

const ASSET = '/assets/landing';
const CHECK_SRC = `${ASSET}/af900d3d05a78ce1eaa2cfe4e4134d654de6e007.svg`;

// Figma service icon set (same as the homepage services cards), assigned by display position.
// `inset` places the vector group inside the 24px icon frame.
const FIGMA_ICONS = [
  { src: `${ASSET}/bf4553ed0c3464738a94a4a4ba471c653bdfaadd.svg`, width: 21.5, height: 21.5, inset: 'inset-[8.33%]' },
  {
    src: `${ASSET}/c043f8532cec88263c5cd6b572ecada13a22b489.svg`,
    width: 21.5,
    height: 19.5,
    inset: 'inset-[12.5%_8.33%]',
  },
  {
    src: `${ASSET}/2320156679041562dcad5c686d80bf37bc7c85b6.svg`,
    width: 17.375,
    height: 21.25,
    inset: 'inset-[9.38%_17.19%_8.33%_16.67%]',
  },
  { src: `${ASSET}/649d25e36f59ffb96c83f4b1870c863b917ecce9.svg`, width: 19.5, height: 19.5, inset: 'inset-[12.5%]' },
];

type ServiceFeatureBlockProps = {
  index: number;
  reverse?: boolean;
  image: string;
  heading: string;
  description: string;
  checklist: string[];
  iconSrc?: string | null;
  imagePosition?: string;
  startingPrice?: number | null;
};

// One service row on /services: photo card + copy card, alternating sides on desktop.
export function ServiceFeatureBlock({
  index,
  reverse = false,
  image,
  heading,
  description,
  checklist,
  iconSrc,
  imagePosition,
  startingPrice,
}: ServiceFeatureBlockProps) {
  const icon = FIGMA_ICONS[index % FIGMA_ICONS.length];
  const number = String(index + 1).padStart(2, '0');

  return (
    <article className='group grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2'>
      <div
        className={`relative min-h-[260px] overflow-hidden rounded-[20px] border border-[#2a2a30] bg-[#1b1b20] sm:min-h-[380px] ${
          reverse ? 'lg:order-2' : ''
        }`}
      >
        <Image
          src={image}
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
          alt={heading}
          fill
          sizes='(min-width: 1024px) 590px, 100vw'
          className='object-cover transition-transform duration-700 group-hover:scale-[1.03]'
        />
        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,19,0)_45%,rgba(17,17,19,0.85)_100%)]' />
        <span className='absolute bottom-4 left-6 font-site-heading text-[56px] leading-none font-extrabold tracking-[-1.68px] text-white/25 sm:bottom-6 sm:left-8 lg:text-[96px]'>
          {number}
        </span>
      </div>

      <div
        className={`${CARD} flex flex-col items-start gap-6 rounded-[20px] p-7 sm:p-10 ${reverse ? 'lg:order-1' : ''}`}
      >
        <div className='flex w-full items-center justify-between gap-3'>
          <div className='flex items-center justify-center rounded-xl bg-white p-3 transition-transform duration-300 group-hover:scale-105'>
            {iconSrc ? (
              <Image src={iconSrc} alt='' width={24} height={24} className='size-6' />
            ) : (
              <span className='relative block size-6 shrink-0 overflow-hidden'>
                <span className={`absolute flex items-center justify-center ${icon.inset}`}>
                  <img src={icon.src} alt='' width={icon.width} height={icon.height} className='block max-w-none' />
                </span>
              </span>
            )}
          </div>
          {startingPrice != null && (
            <span className='rounded-full border border-[#2a2a30] px-2.5 py-1 font-site-body text-[10px] leading-normal tracking-[0.4px] text-[#c6c6c6] uppercase'>
              From €{startingPrice}
            </span>
          )}
        </div>

        <div className='flex flex-col gap-3'>
          <h3 className='font-site-heading text-[26px] leading-[32px] font-extrabold tracking-[-0.52px] text-white uppercase sm:text-[32px] sm:leading-[38px]'>
            {heading}
          </h3>
          <p className={BODY_TEXT}>{description}</p>
        </div>

        {checklist.length > 0 && (
          <ul className='flex w-full flex-col gap-4 border-t border-[#232328] pt-6'>
            {checklist.map((label) => (
              <li key={label} className='flex items-start gap-4'>
                <span className='flex shrink-0 items-center justify-center rounded-full bg-[#055e45] p-1.5'>
                  <span aria-hidden className='relative block size-4 shrink-0 overflow-clip'>
                    <span className='absolute inset-[27.08%_20.83%] block'>
                      <span className='absolute inset-[-10.23%_-8.04%] block'>
                        <img alt='' src={CHECK_SRC} className='block size-full max-w-none' />
                      </span>
                    </span>
                  </span>
                </span>
                <span className='pt-0.5 font-site-body text-[15px] leading-[22px] text-white'>{label}</span>
              </li>
            ))}
          </ul>
        )}

        <ButtonLink href='/get-a-quote' className='mt-auto w-full sm:w-auto'>
          Get a quote
        </ButtonLink>
      </div>
    </article>
  );
}
