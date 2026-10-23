import Image from 'next/image';
import type { PartnerLogoPublic } from '@/features/partner-logos/types';
import type { TestimonialPublic } from '@/features/testimonials/types';

interface StitchSocialProofProps {
  testimonials: TestimonialPublic[];
  // Kept for API compatibility; the current design has no insurer strip, so logos are not rendered.
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

const STAR_ICON = '/assets/landing/eb9fbcb6b25439979442168a65362f6aefd65c01.svg';
const EYEBROW_DOT = '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg';

// Design content, rendered until featured testimonials are added in the CMS.
const DEFAULT_REVIEWS: ReviewCard[] = [
  {
    key: 'ciaran',
    name: "Ciaran O'Connor",
    rating: 5,
    text: 'Someone ran into the driver door of my Mercedes E-Class in Dun Laoghaire. The team dealt directly with AXA, gave me a free replacement car within 2 hours and returned my car looking brand new. Flawless pearl match.',
    meta: 'Dublin 4 · Mercedes E300de',
    badge: 'Verified Claim',
  },
  {
    key: 'siobhan',
    name: 'Siobhan Kelly',
    rating: 5,
    text: 'Had our Porsche Macan resprayed on the front bumper and bonnet after stone-chip damage. The Blowtherm booth finish is identical to factory Stuttgart paint. Outstanding craftsmanship.',
    meta: 'Malahide · Porsche Macan GTS',
    badge: 'Private Repair',
  },
  {
    key: 'declan',
    name: 'Declan Ryan',
    rating: 5,
    text: 'The online quote system was genuinely seamless. Uploaded 3 photos of an ugly rear-arch dent, got a quote in 40 minutes, dropped it off Tuesday morning and collected it Thursday. Exceptional team.',
    meta: 'Sandyford · Audi A6 Avant',
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

// Cards = featured testimonials from the CMS; design defaults render when none exist.
export function StitchSocialProof({ testimonials }: StitchSocialProofProps) {
  const reviews = testimonials.length > 0 ? testimonials.map(toReviewCard) : DEFAULT_REVIEWS;

  return (
    <section id='insurance' className='bg-[#16161a]'>
      <div className='mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:gap-[72px] lg:py-[120px] xl:px-0'>
        {/* Section Header */}
        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <div className='flex flex-col items-start gap-5'>
            <div className='flex items-center gap-2.5 rounded-full border border-[#2a2a30] bg-[#232323] py-[7px] pr-4 pl-3.5'>
              <Image src={EYEBROW_DOT} alt='' unoptimized width={6} height={6} className='block size-1.5 shrink-0' />
              <span className='font-site-body text-[11px] leading-normal tracking-[0.44px] whitespace-nowrap text-[#c6c6c6] uppercase'>
                What Dublin Drivers Say
              </span>
            </div>
            <h2 className='max-w-[499px] font-site-heading text-[34px] leading-[40px] font-extrabold tracking-[-0.68px] text-white uppercase sm:text-[48px] sm:leading-[54px] sm:tracking-[-0.96px]'>
              Trusted by <span className='text-brand'>180+ local drivers.</span>
            </h2>
          </div>
          <p className='max-w-[440px] font-site-body text-base leading-[26px] text-[#b5b5b5]'>
            Rated 4.9 on Google for craftsmanship, communication and a hassle-free insurance process.
          </p>
        </div>

        {/* Reviews */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {reviews.map((review) => (
            <article
              key={review.key}
              className='flex flex-col justify-between rounded-2xl border border-[#2a2a30] bg-[#1b1b20] p-7 lg:min-h-[309px]'
            >
              <div className='flex flex-col gap-5 pb-2'>
                <div className='flex gap-[3px]' role='img' aria-label={`${review.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className='flex size-3.5 shrink-0 items-center justify-center'>
                      <Image
                        src={STAR_ICON}
                        unoptimized
                        alt=''
                        width={12.5434}
                        height={12.5426}
                        className={`block max-w-none ${n <= review.rating ? '' : 'opacity-20 grayscale'}`}
                      />
                    </span>
                  ))}
                </div>
                <p className='font-site-body text-base leading-[26px] text-[#c6c6c6]'>{review.text}</p>
              </div>

              <div className='flex items-center justify-between gap-3 border-t border-[#2a2a30] pt-5'>
                <div className='flex min-w-0 flex-col gap-[3px] font-site-body leading-normal'>
                  <span className='truncate text-sm font-semibold text-white'>{review.name}</span>
                  {review.meta && (
                    <span className='truncate text-[10px] tracking-[0.4px] text-[#999] uppercase'>{review.meta}</span>
                  )}
                </div>
                <span className='shrink-0 rounded-full border border-white/12 bg-white/6 px-2.5 py-[5px] font-site-body text-[10px] leading-normal tracking-[0.4px] whitespace-nowrap text-[#a1a1aa] uppercase'>
                  {review.badge}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
