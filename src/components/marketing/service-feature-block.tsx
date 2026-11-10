import { QuoteButton } from '@/components/marketing/quote-cta';
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
  /** The service's own /services/<slug> page. */
  href: string;
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
  href,
}: ServiceFeatureBlockProps) {
  const icon = FIGMA_ICONS[index % FIGMA_ICONS.length];
  const number = String(index + 1).padStart(2, '0');

  return (
    <article className='group grid grid-cols-1 items-stretch gap-3 sm:gap-5 lg:grid-cols-2 xl:h-full xl:grid-cols-1'>
      <div
        className={`relative min-h-[200px] overflow-hidden rounded-[18px] border border-[#353c47] bg-[#262b34] sm:min-h-[380px] sm:rounded-[20px] xl:hidden ${
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
        <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(27,31,38,0)_45%,rgba(27,31,38,0.85)_100%)]' />
        <span
          data-drift
          className='absolute bottom-4 left-6 font-site-heading text-[56px] leading-none font-extrabold tracking-[-1.68px] text-white/25 sm:bottom-6 sm:left-8 lg:text-[96px]'
        >
          {number}
        </span>
      </div>

      <div
        className={`${CARD} flex flex-col items-start gap-[14px] rounded-[18px] p-5 sm:gap-6 sm:rounded-[20px] sm:p-10 xl:h-full xl:gap-[18px] xl:rounded-2xl xl:p-[26px] ${reverse ? 'lg:order-1 xl:order-none' : ''}`}
      >
        <div className='flex w-full items-center justify-between gap-3'>
          <div className='flex items-center justify-center rounded-xl bg-[#f1f3f6] p-3 transition-transform duration-300 group-hover:scale-105'>
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
            <span className='rounded-full border border-[#353c47] px-2.5 py-1 font-site-body text-[10px] leading-normal tracking-[0.4px] text-[#c9ced6] uppercase xl:border-white/12 xl:bg-white/6 xl:px-3 xl:py-1.5 xl:text-[13px] xl:font-bold xl:tracking-normal xl:text-[#f1f3f6]'>
              From €{startingPrice}
            </span>
          )}
        </div>

        <div className='flex flex-col gap-2 sm:gap-3 xl:gap-2.5'>
          <h3 className='font-site-heading text-[18px] leading-normal font-semibold tracking-normal text-[#f1f3f6] normal-case sm:text-[32px] sm:leading-[38px] sm:font-extrabold sm:tracking-[-0.52px] sm:uppercase xl:text-[20px] xl:leading-[26px] xl:font-bold xl:tracking-[-0.1px] xl:normal-case'>
            {heading}
          </h3>
          <p className={`${BODY_TEXT} xl:text-[14px] xl:leading-[22px]`}>{description}</p>
        </div>

        {checklist.length > 0 && (
          <ul className='flex w-full flex-col gap-2 border-t border-[#353c47] pt-[14px] sm:gap-4 sm:border-[#2e343e] sm:pt-6 xl:gap-2.5 xl:border-[#353c47] xl:pt-[18px]'>
            {checklist.map((label) => (
              <li key={label} className='flex items-start gap-2 sm:gap-4 xl:items-center xl:gap-2.5'>
                <span className='flex shrink-0 items-center justify-center rounded-full bg-[#055e45] p-1.5 xl:p-0'>
                  <span aria-hidden className='relative block size-4 shrink-0 overflow-clip'>
                    <span className='absolute inset-[27.08%_20.83%] block'>
                      <span className='absolute inset-[-10.23%_-8.04%] block'>
                        <img alt='' src={CHECK_SRC} className='block size-full max-w-none' />
                      </span>
                    </span>
                  </span>
                </span>
                <span className='font-site-body text-[14px] leading-[22px] text-[#d5d9e0] sm:pt-0.5 sm:text-[15px] sm:text-[#f1f3f6] xl:pt-0 xl:text-[13px] xl:font-medium xl:text-[#d5d9e0]'>
                  {label}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className='mt-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row xl:w-full xl:flex-col'>
          <ButtonLink href={href} variant='secondary' className='w-full sm:w-auto xl:w-full'>
            Learn more
          </ButtonLink>
          <QuoteButton className='w-full sm:w-auto xl:w-full' />
        </div>
      </div>
    </article>
  );
}
