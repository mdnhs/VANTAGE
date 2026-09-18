import Image from 'next/image';
import Link from 'next/link';

interface InsuranceCtaProps {
  line1: string;
  accent: string;
  subtext: string;
}

export function InsuranceCta({ line1, accent, subtext }: InsuranceCtaProps) {
  return (
    <section className='intersect-once container mx-auto flex flex-col items-center gap-6 bg-[#353534] px-4 py-16 text-center sm:gap-8 sm:px-6 sm:py-24 lg:px-12 intersect:motion-preset-slide-up'>
      <h2 className='max-w-[768px] font-[family-name:var(--font-manrope)] text-2xl font-extrabold tracking-tight text-[#e5e2e1] uppercase sm:text-4xl sm:leading-[1.2] lg:text-[64px] lg:leading-[80px]'>
        {line1}
        <br />
        <span className='text-[#dc2626]'>{accent}</span>
      </h2>

      <p className='max-w-[576px] text-base leading-relaxed text-neutral-300 sm:text-lg sm:leading-7'>{subtext}</p>

      <div className='flex w-full flex-col items-center justify-center gap-3 pt-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-6'>
        <Link
          href='/get-a-quote'
          className='flex w-full items-center justify-center gap-2 rounded bg-[#dc2626] px-8 py-4 text-xs font-bold tracking-[1.2px] text-white uppercase shadow-[0_4px_20px_rgba(220,38,38,0.4)] transition-all hover:-translate-y-1 hover:bg-red-700 sm:w-auto'
        >
          <Image
            src='/assets/marketing/icon-cta-phone.svg'
            alt=''
            width={15}
            height={14}
            className='h-[14px] w-[15px]'
          />
          <span>Talk to Our Specialists</span>
        </Link>
        <Link
          href='/get-a-quote'
          className='flex w-full items-center justify-center gap-2 rounded border border-white/20 bg-white/10 px-8 py-4 text-xs font-semibold tracking-[1.2px] text-white uppercase transition-all hover:-translate-y-1 hover:bg-white/20 sm:w-auto'
        >
          <Image src='/assets/marketing/icon-cta-upload.svg' alt='' width={12} height={15} className='h-[15px] w-3' />
          <span>Upload Estimate</span>
        </Link>
      </div>
    </section>
  );
}
