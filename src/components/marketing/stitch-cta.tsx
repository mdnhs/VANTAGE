import { AlarmClock, Calculator, Phone, MessageSquare } from 'lucide-react';

export function StitchCta({ phone }: { phone: string }) {
  const digits = phone.replace(/[^\d+]/g, '');

  return (
    <section
      id='contact'
      className='relative w-full overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#141414] to-[#0a0a0a] py-24'
    >
      <div className='relative z-10 container mx-auto flex flex-col items-center px-6 text-center sm:px-12'>
        {/* Eyebrow Badge */}
        <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-red-800/40 bg-red-950/50 px-3 py-1 text-[#ffb4ab]'>
          <AlarmClock className='size-3.5' />
          <span className='font-mono text-xs tracking-wider uppercase'>Same-Day Walk-In Vehicle Assessments</span>
        </div>

        {/* Heading */}
        <h2 className='max-w-3xl font-[family-name:var(--font-manrope)] text-4xl leading-[1.2] font-extrabold tracking-tight text-white uppercase lg:text-[64px] lg:leading-[80px]'>
          Ready To Restore Your Vehicle <br />
          <span className='text-[#dc2626]'>To Flawless Standard?</span>
        </h2>

        {/* Body */}
        <p className='mt-4 mb-8 max-w-xl text-lg leading-7 text-neutral-400'>
          Speak directly with our Dublin master technicians or submit your damage photos online for an immediate digital
          estimate.
        </p>

        {/* Action Buttons */}
        <div className='flex flex-wrap items-center justify-center gap-4'>
          <a
            href='#estimator'
            className='flex items-center gap-2 rounded bg-[#dc2626] px-8 py-4 text-sm font-bold tracking-widest text-white uppercase shadow-[0_4px_30px_rgba(220,38,38,0.4)] transition-all hover:bg-red-700'
          >
            <Calculator className='size-[18px]' />
            <span>Get Free Quote Online</span>
          </a>

          <a
            href={`tel:${digits}`}
            className='flex items-center gap-2 rounded border border-white/20 bg-white/10 px-8 py-4 text-sm tracking-widest text-white uppercase transition-all hover:bg-white/20'
          >
            <Phone className='size-[18px] text-emerald-400' />
            <span>Call Workshop Now</span>
          </a>

          <a
            href={`https://wa.me/${digits.replace('+', '')}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-2 rounded border border-[#25D366]/30 bg-[#25D366]/20 px-6 py-4 text-sm tracking-widest text-emerald-400 uppercase transition-all hover:bg-[#25D366]/30'
          >
            <MessageSquare className='size-[18px]' />
            <span>WhatsApp Photos</span>
          </a>
        </div>
      </div>
    </section>
  );
}
