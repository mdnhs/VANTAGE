import { AlarmClock, Calculator, Phone, MessageSquare } from 'lucide-react';

export function StitchCta({ phone }: { phone: string }) {
  const digits = phone.replace(/[^\d+]/g, '');

  return (
    <section
      id='contact'
      className='relative w-full overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] py-16 sm:py-24'
    >
      <div className='intersect-once relative z-10 container mx-auto flex flex-col items-center px-4 text-center motion-duration-700 sm:px-6 lg:px-12 intersect:motion-preset-slide-up'>
        {/* Eyebrow Badge */}
        <div className='mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-red-800/40 bg-red-950/50 px-3.5 py-1 text-red-400'>
          <AlarmClock className='size-3.5 shrink-0' />
          <span className='truncate font-mono text-[11px] tracking-wider uppercase sm:text-xs sm:whitespace-normal'>
            Same-Day Walk-In Vehicle Assessments
          </span>
        </div>

        {/* Heading */}
        <h2 className='xs:text-3xl w-full font-[family-name:var(--font-manrope)] text-2xl font-extrabold tracking-tight text-white uppercase sm:text-5xl md:text-6xl lg:text-[64px] lg:leading-[1.15] xl:text-[72px] xl:leading-[1.1]'>
          Ready To Restore Your Vehicle <br className='hidden sm:inline' />
          <span className='text-[#dc2626]'>To Flawless Standard?</span>
        </h2>

        {/* Body */}
        <p className='mt-4 mb-8 max-w-2xl text-base leading-relaxed text-neutral-400 sm:mt-6 sm:text-lg'>
          Speak directly with our Dublin master technicians or submit your damage photos online for an immediate digital
          estimate.
        </p>

        {/* Action Buttons */}
        <div className='flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4'>
          <a
            href='#estimator'
            className='flex w-full items-center justify-center gap-2 rounded bg-[#dc2626] px-6 py-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-[0_4px_30px_rgba(220,38,38,0.4)] transition-all hover:bg-red-700 sm:w-auto sm:px-8 sm:py-4 sm:text-sm'
          >
            <Calculator className='size-4 sm:size-[18px]' />
            <span>Get Free Quote Online</span>
          </a>

          <a
            href={`tel:${digits}`}
            className='flex w-full items-center justify-center gap-2 rounded border border-white/20 bg-white/10 px-6 py-3.5 text-xs tracking-widest text-white uppercase transition-all hover:bg-white/20 sm:w-auto sm:px-8 sm:py-4 sm:text-sm'
          >
            <Phone className='size-4 text-emerald-400 sm:size-[18px]' />
            <span>Call Workshop Now</span>
          </a>

          <a
            href={`https://wa.me/${digits.replace('+', '')}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex w-full items-center justify-center gap-2 rounded border border-[#25D366]/30 bg-[#25D366]/20 px-6 py-3.5 text-xs tracking-widest text-emerald-400 uppercase transition-all hover:bg-[#25D366]/30 sm:w-auto sm:py-4 sm:text-sm'
          >
            <MessageSquare className='size-4 sm:size-[18px]' />
            <span>WhatsApp Photos</span>
          </a>
        </div>
      </div>
    </section>
  );
}
