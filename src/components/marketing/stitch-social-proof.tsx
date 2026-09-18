import Image from 'next/image';
import { Star } from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';
import type { PartnerLogoPublic } from '@/features/partner-logos/types';
import type { TestimonialPublic } from '@/features/testimonials/types';

interface StitchSocialProofProps {
  testimonials: TestimonialPublic[];
  partnerLogos: PartnerLogoPublic[];
}

interface ReviewCard {
  key: string;
  name: string;
  rating: number;
  text: string;
  meta: string | null;
  badge: string;
}

const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150', 'motion-delay-300'];

// Design content, rendered until insurers / featured testimonials are added in the CMS.
const DEFAULT_INSURERS = ['ALLIANZ', 'AXA INSURANCE', 'ZURICH', 'FBD INSURANCE', 'AVIVA', 'LIBERTY'];

const DEFAULT_REVIEWS: ReviewCard[] = [
  {
    key: 'ciaran',
    name: "Ciaran O'Connor",
    rating: 5,
    text: 'Someone ran into the driver door of my Mercedes E-Class in Dun Laoghaire. Vantage dealt directly with AXA, provided a free replacement car within 2 hours, and returned my car looking brand new. Flawless pearl match.',
    meta: 'Dublin 4 • Mercedes E300de',
    badge: 'Verified Claim',
  },
  {
    key: 'siobhan',
    name: 'Siobhan Kelly',
    rating: 5,
    text: 'Had our Porsche Macan resprayed on the front bumper and bonnet after stone chip road rash. The Blowtherm booth finish is identical to factory Stuttgart paint. Outstanding craftsmanship.',
    meta: 'Malahide • Porsche Macan GTS',
    badge: 'Private Repair',
  },
  {
    key: 'declan',
    name: 'Declan Ryan',
    rating: 5,
    text: 'The online quote system was genuinely seamless. Uploaded 3 photos of an ugly rear arch dent, got a quote in 40 minutes, dropped it off Tuesday morning, and collected it Thursday. Exceptional team.',
    meta: 'Sandyford • Audi A6 Avant',
    badge: 'Verified PDR',
  },
];

function toReviewCard(testimonial: TestimonialPublic): ReviewCard {
  return {
    key: testimonial.id,
    name: testimonial.customerName,
    rating: testimonial.rating,
    text: testimonial.reviewText,
    meta: testimonial.serviceReceived,
    badge: 'Verified',
  };
}

// Insurer ribbon = CMS partner logos, cards = featured testimonials; design defaults fill empty halves.
export function StitchSocialProof({ testimonials, partnerLogos }: StitchSocialProofProps) {
  const reviews = testimonials.length > 0 ? testimonials.map(toReviewCard) : DEFAULT_REVIEWS;

  return (
    <section id='insurance' className='container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-12'>
      {/* Insurer Ribbon */}
      <div className='intersect-once mb-12 border-b border-white/10 pb-12 motion-duration-700 sm:mb-16 sm:pb-16 intersect:motion-preset-fade'>
        <div className='mb-6 text-center sm:mb-8'>
          <span className='font-mono text-xs tracking-[0.2em] text-neutral-400 uppercase'>
            Accepted By Ireland&apos;s Leading Motor Insurers
          </span>
        </div>
        <div className='flex flex-wrap items-center justify-center gap-6 opacity-75 sm:gap-8 md:gap-14'>
          {partnerLogos.length > 0
            ? partnerLogos.map((logo) => {
                const image = (
                  <Image
                    src={cldUrl(logo.logoPublicId, { width: 320, height: 160, crop: 'fit' })}
                    alt={logo.companyName}
                    width={120}
                    height={60}
                    className='h-10 w-auto object-contain grayscale transition-[filter] duration-300 hover:grayscale-0'
                  />
                );

                return logo.websiteUrl ? (
                  <a
                    key={logo.id}
                    href={logo.websiteUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={logo.companyName}
                    className='shrink-0'
                  >
                    {image}
                  </a>
                ) : (
                  <span key={logo.id} className='shrink-0'>
                    {image}
                  </span>
                );
              })
            : DEFAULT_INSURERS.map((name) => (
                <div
                  key={name}
                  className='font-[family-name:var(--font-manrope)] text-lg font-extrabold tracking-widest text-neutral-400 transition-colors hover:text-white'
                >
                  {name}
                </div>
              ))}
        </div>
      </div>

      {/* Testimonial Cards */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {reviews.map((review, index) => (
          <div
            key={review.key}
            className={`intersect-once flex flex-col justify-between rounded-lg border border-white/10 bg-[#141414] p-6 intersect:motion-preset-slide-up ${STAGGER_DELAY[index % STAGGER_DELAY.length]}`}
          >
            <div className='space-y-3'>
              <div className='flex gap-0.5' aria-label={`${review.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`size-3.5 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-white/15'}`}
                  />
                ))}
              </div>
              <p className='text-base leading-6 text-neutral-300'>&ldquo;{review.text}&rdquo;</p>
            </div>

            <div className='mt-4 flex items-center justify-between border-t border-white/5 pt-4'>
              <div>
                <div className='text-sm font-semibold text-white'>{review.name}</div>
                {review.meta && <div className='font-mono text-[11px] text-neutral-500'>{review.meta}</div>}
              </div>
              <span className='rounded border border-emerald-800/40 bg-emerald-950/60 px-2 py-0.5 font-mono text-[10px] text-emerald-400'>
                {review.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
