import { Star } from 'lucide-react';

const INSURERS = ['ALLIANZ', 'AXA INSURANCE', 'ZURICH', 'FBD INSURANCE', 'AVIVA', 'LIBERTY'];

const TESTIMONIALS = [
  {
    quote:
      'Someone ran into the driver door of my Mercedes E-Class in Dun Laoghaire. Vantage dealt directly with AXA, provided a free replacement car within 2 hours, and returned my car looking brand new. Flawless pearl match.',
    author: "Ciaran O'Connor",
    detail: 'Dublin 4 • Mercedes E300de',
    badge: 'Verified Claim',
  },
  {
    quote:
      'Had our Porsche Macan resprayed on the front bumper and bonnet after stone chip road rash. The Blowtherm booth finish is identical to factory Stuttgart paint. Outstanding craftsmanship.',
    author: 'Sean Fitzharris',
    detail: 'Foxrock • Porsche Macan GTS',
    badge: 'Verified Respray',
  },
  {
    quote:
      'The online quote system was genuinely seamless. Uploaded 3 photos of an ugly rear arch dent, got a quote in 40 minutes, dropped it off Tuesday morning, and collected it Thursday. Exceptional team.',
    author: 'Declan Ryan',
    detail: 'Sandyford • Audi A6 Avant',
    badge: 'Verified PDR',
  },
];

export function StitchSocialProof() {
  return (
    <section id='insurance' className='mx-auto w-full max-w-[1280px] px-4 py-24 sm:px-6 lg:px-8'>
      {/* Insurer Ribbon */}
      <div className='mb-16 border-b border-white/10 pb-16'>
        <div className='mb-8 text-center'>
          <span className='font-mono text-xs tracking-[0.2em] text-neutral-400 uppercase'>
            Accepted By Ireland&apos;s Leading Motor Insurers
          </span>
        </div>
        <div className='flex flex-wrap items-center justify-center gap-8 opacity-75 md:gap-14'>
          {INSURERS.map((insurer) => (
            <div
              key={insurer}
              className='font-[family-name:var(--font-manrope)] text-lg font-extrabold tracking-widest text-neutral-400 transition-colors hover:text-white'
            >
              {insurer}
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial Cards */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {TESTIMONIALS.map((testimonial) => (
          <div
            key={testimonial.author}
            className='flex flex-col justify-between rounded-lg border border-white/10 bg-[#141414] p-6'
          >
            <div className='space-y-3'>
              <div className='flex text-amber-400'>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className='size-4 fill-amber-400 text-amber-400' />
                ))}
              </div>
              <p className='text-xs leading-relaxed text-neutral-300'>&ldquo;{testimonial.quote}&rdquo;</p>
            </div>

            <div className='mt-6 flex items-center justify-between border-t border-white/5 pt-4'>
              <div>
                <div className='text-xs font-bold text-white'>{testimonial.author}</div>
                <div className='font-mono text-[11px] text-neutral-500'>{testimonial.detail}</div>
              </div>
              <span className='rounded border border-emerald-800/40 bg-emerald-950/60 px-2 py-0.5 font-mono text-[10px] text-emerald-400'>
                {testimonial.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
