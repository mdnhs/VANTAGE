import Image from 'next/image';
import { Star } from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';
import type { TestimonialPublic } from '@/features/testimonials/types';

// Literal class names so Tailwind's content scanner can pick them up statically.
const STAGGER_DELAY = ['motion-delay-0', 'motion-delay-150', 'motion-delay-300', 'motion-delay-450'];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className='flex items-center gap-1' aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`size-4 ${n <= rating ? 'fill-[#ffb4ab] text-[#ffb4ab]' : 'text-white/15'}`} />
      ))}
    </div>
  );
}

interface TestimonialsSectionProps {
  testimonials: TestimonialPublic[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (testimonials.length === 0) return null;

  return (
    <section id='testimonials' className='flex flex-col gap-16 px-6 py-20 sm:px-12 lg:py-[120px]'>
      <div className='intersect-once flex flex-col gap-4 intersect:motion-preset-slide-up-sm'>
        <div className='flex items-center gap-4'>
          <span className='h-px w-8 bg-[#ffb4ab]/50' />
          <span className='text-xs font-semibold tracking-[1.2px] text-[#ffb4ab] uppercase'>Client Feedback</span>
        </div>
        <h2 className='font-[family-name:var(--font-manrope)] text-4xl leading-[1.2] font-bold tracking-[-1px] text-[#e5e2e1] uppercase lg:text-[40px] lg:leading-[48px]'>
          Trusted By
          <br />
          <span className='text-[#ffb4ab]'>Our Customers.</span>
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className={`intersect-once flex min-h-[280px] flex-col gap-6 rounded-lg border border-white/10 bg-white/4 px-8 pt-8 pb-6 backdrop-blur-md transition-colors duration-300 hover:border-[#ffb4ab]/40 intersect:motion-preset-slide-up ${STAGGER_DELAY[index % STAGGER_DELAY.length]}`}
          >
            <RatingStars rating={testimonial.rating} />

            <p className='flex-1 text-base leading-6 text-[#e6bdb8]'>&ldquo;{testimonial.reviewText}&rdquo;</p>

            <div className='flex items-center gap-3 border-t border-white/10 pt-6'>
              {testimonial.avatarPublicId ? (
                <Image
                  src={cldUrl(testimonial.avatarPublicId, { width: 88, height: 88, crop: 'fill', gravity: 'face' })}
                  alt=''
                  width={44}
                  height={44}
                  className='size-11 shrink-0 rounded-full object-cover'
                />
              ) : (
                <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-[#201f1f] font-[family-name:var(--font-manrope)] text-sm font-semibold text-[#e5e2e1]'>
                  {initials(testimonial.customerName)}
                </div>
              )}
              <div className='flex flex-col'>
                <span className='font-[family-name:var(--font-manrope)] text-sm font-semibold text-[#e5e2e1]'>
                  {testimonial.customerName}
                </span>
                {testimonial.serviceReceived && (
                  <span className='text-xs tracking-[0.4px] text-[#e6bdb8] uppercase'>
                    {testimonial.serviceReceived}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
