import Image from 'next/image';
import Link from 'next/link';

type ChecklistItem = {
  icon: string;
  label: string;
};

type ServiceFeatureBlockProps = {
  reverse?: boolean;
  image: string;
  watermark: string;
  heading: string;
  description: string;
  checklist: ChecklistItem[];
};

export function ServiceFeatureBlock({
  reverse = false,
  image,
  watermark,
  heading,
  description,
  checklist,
}: ServiceFeatureBlockProps) {
  return (
    <div className='grid grid-cols-1 items-center gap-6 lg:grid-cols-12'>
      <div
        className={`intersect-once relative h-[400px] overflow-hidden rounded-xl lg:h-[600px] ${
          reverse
            ? 'lg:order-2 lg:col-span-7 lg:col-start-6 intersect:motion-preset-slide-left'
            : 'lg:col-span-7 intersect:motion-preset-slide-right'
        }`}
      >
        <Image src={image} alt={heading} fill className='object-cover' />
        <div className='absolute inset-0 bg-gradient-to-t from-[rgba(19,19,19,0.8)] to-transparent' />
        <div
          className={`absolute bottom-0 font-[family-name:var(--font-manrope)] text-8xl leading-none text-[#e5e2e1]/20 lg:text-[128px] ${
            reverse ? 'right-6' : 'left-6'
          }`}
        >
          {watermark}
        </div>
      </div>

      <div
        className={`intersect-once relative flex flex-col gap-6 rounded-xl bg-[#201f1f]/95 p-8 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md motion-delay-150 lg:p-12 ${
          reverse
            ? 'lg:order-1 lg:col-span-5 intersect:motion-preset-slide-right'
            : 'lg:col-span-5 lg:col-start-8 lg:-ml-16 intersect:motion-preset-slide-left'
        }`}
      >
        <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-[-1px] text-[#e5e2e1] uppercase lg:text-[40px] lg:leading-[48px]'>
          {heading}
        </h2>

        <p className='text-base leading-6 text-[#e6bdb8]'>{description}</p>

        {checklist.length > 0 && (
          <ul className='flex flex-col gap-3'>
            {checklist.map((item) => (
              <li key={item.label} className='group flex items-center gap-3'>
                <Image
                  src={item.icon}
                  alt=''
                  width={17}
                  height={17}
                  className='size-[17px] transition-transform duration-300 group-hover:scale-125'
                />
                <span className='text-base text-[#e5e2e1]'>{item.label}</span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href='/get-a-quote'
          className='group flex w-fit items-center gap-2 bg-[#ffb4ab] px-8 py-4 text-xs font-semibold tracking-[1.2px] text-[#690005] uppercase transition-all hover:-translate-y-1 hover:opacity-90'
        >
          Get a Quote
          <Image
            src='/assets/marketing/icon-cta-arrow.svg'
            alt=''
            width={16}
            height={16}
            className='size-4 transition-transform duration-300 group-hover:translate-x-1'
          />
        </Link>
      </div>
    </div>
  );
}
