import { Clock, Calculator, Phone, MessageSquare } from 'lucide-react';

export function StitchCta() {
  return (
    <section
      id='contact'
      className='relative w-full overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] py-24'
    >
      <div className='relative z-10 mx-auto flex max-w-[1280px] flex-col items-center px-4 text-center sm:px-6 lg:px-8'>
        {/* Eyebrow Badge */}
        <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-red-800/40 bg-red-950/50 px-3.5 py-1 text-red-300'>
          <Clock className='size-3.5' />
          <span className='font-mono text-xs tracking-wider uppercase'>Same-Day Walk-In Vehicle Assessments</span>
        </div>

        {/* Heading */}
        <h2 className='max-w-3xl font-[family-name:var(--font-manrope)] text-3xl leading-tight font-bold tracking-tight text-white uppercase sm:text-4xl lg:text-[44px] lg:leading-[52px]'>
          Ready To Restore Your Vehicle <br />
          <span className='text-[#dc2626]'>To Flawless Standard?</span>
        </h2>

        {/* Body */}
        <p className='mt-4 mb-8 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base'>
          Speak directly with our Dublin master technicians or submit your damage photos online for an immediate digital
          estimate.
        </p>

        {/* Action Buttons */}
        <div className='flex flex-wrap items-center justify-center gap-4'>
          <a
            href='#estimator'
            className='flex items-center gap-2.5 rounded bg-[#dc2626] px-8 py-4 text-xs font-bold tracking-widest text-white uppercase shadow-[0_4px_30px_rgba(220,38,38,0.4)] transition-all hover:bg-red-700'
          >
            <Calculator className='size-4' />
            <span>Get Free Quote Online</span>
          </a>

          <a
            href='tel:+35312345678'
            className='flex items-center gap-2.5 rounded border border-white/20 bg-white/10 px-8 py-4 text-xs font-semibold tracking-widest text-white uppercase transition-all hover:bg-white/20'
          >
            <Phone className='size-4 text-emerald-400' />
            <span>Call Workshop Now</span>
          </a>

          <a
            href='https://wa.me/35312345678'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-2.5 rounded border border-[#25D366]/30 bg-[#25D366]/20 px-6 py-4 text-xs font-semibold tracking-widest text-emerald-400 uppercase transition-all hover:bg-[#25D366]/30'
          >
            <MessageSquare className='size-4' />
            <span>WhatsApp Photos</span>
          </a>
        </div>
      </div>
    </section>
  );
}
