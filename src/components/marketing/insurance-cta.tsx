import Image from 'next/image';
import Link from 'next/link';

export function InsuranceCta() {
  return (
    <section className='intersect-once flex flex-col items-center gap-8 bg-[#353534] px-6 py-24 text-center sm:px-12 intersect:motion-preset-slide-up'>
      <h2 className='max-w-[768px] font-[family-name:var(--font-manrope)] text-4xl leading-[1.2] font-extrabold tracking-[-1.28px] text-[#e5e2e1] uppercase lg:text-[64px] lg:leading-[80px]'>
        Ready to Hand Over
        <br />
        <span className='text-[#ffb4ab]'>The Keys?</span>
      </h2>

      <p className='max-w-[576px] text-lg leading-7 text-[#e6bdb8]'>
        Connect with our claims team. We&apos;ll outline your options in five minutes and set the gears in motion
        immediately.
      </p>

      <div className='flex flex-wrap justify-center gap-6 pt-2'>
        <Link
          href='/get-a-quote'
          className='flex items-center gap-2 bg-[#ffb4ab] px-8 py-4 text-xs font-semibold tracking-[1.2px] text-[#690005] uppercase shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 hover:opacity-90'
        >
          <Image
            src='/assets/marketing/icon-cta-phone.svg'
            alt=''
            width={15}
            height={14}
            className='h-[14px] w-[15px]'
          />
          Talk to Our Specialists
        </Link>
        <Link
          href='/get-a-quote'
          className='flex items-center gap-2 px-8 py-4 text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase shadow-[0px_0px_0px_1px_#ffb4ab] transition-all hover:-translate-y-1 hover:bg-white/5'
        >
          <Image src='/assets/marketing/icon-cta-upload.svg' alt='' width={12} height={15} className='h-[15px] w-3' />
          Upload Estimate
        </Link>
      </div>
    </section>
  );
}
