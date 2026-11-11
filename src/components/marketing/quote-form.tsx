'use client';

import { useInsuranceEnabled } from '@/contexts/insurance-context';
import { visibleCopy } from '@/lib/features';
import { RevealContent } from '@/components/marketing/ui/reveal-content';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PRESS } from '@/components/marketing/ui/motion-link';
import { DrawCheck } from '@/components/marketing/ui/reveal';
import { imageFileToDataUrl } from '@/lib/image-to-data-url';
import { whatsappHref } from '@/lib/content/phone';
import { submitQuoteRequest } from '@/features/quote-requests/services/api';
import { track } from '@/lib/tracking/track';
import type { GlobalValue } from '@/lib/content/globals';
import { fillCopy } from '@/components/marketing/ui/copy-template';
import { newEventId } from '@/lib/tracking/event-id';
import { HoneypotField } from '@/components/marketing/honeypot-field';
import { useEnquiryStamp } from '@/features/enquiries/hooks/use-enquiry-stamp';

// Figma-exported icon glyphs shared with the homepage estimator (node 131:204)
const ICONS = {
  dot: '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg',
  check: '/assets/landing/af900d3d05a78ce1eaa2cfe4e4134d654de6e007.svg',
  shield: '/assets/landing/c8658e6226cec27e466cc2e667edfe110cf9e0d5.svg',
  star: '/assets/landing/8eb2725bb6ffb8bbe6d5d8c53e0004091ca272f4.svg',
  zap: '/assets/landing/fd10f2e7d9775f83bb5963cf33996d15acaf6164.svg',
  upload: '/assets/landing/d67c13a6cce7df3d3e67ee755b356d94c1f1ca8e.svg',
  quote: '/assets/landing/77f4614fe4f24a8e612134c222c8e6b222b0af4f.svg',
  arrow: '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg',
  whatsapp: '/assets/landing/09936fdd2159e847dcf168e3160a539c758f5211.svg',
};

const MAX_PHOTOS = 4;

type QuoteCopy = GlobalValue<'quoteForm'>;

// Field classes copied from the homepage estimator so both forms read identically.
const FIELD_LABEL =
  'block text-[12px] leading-normal tracking-[0.48px] text-[#a4abb6] uppercase sm:text-[11px] sm:tracking-[0.66px]';
const FIELD_INPUT =
  'w-full rounded-[12px] border border-[#3e4551] bg-[#2e343e] px-[12px] py-[10px] text-[16px] text-[#f1f3f6] sm:border-[#353c47] sm:bg-[#1b1f26] sm:px-[14px] sm:text-[14px] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#7d8591] focus:border-brand focus:shadow-[0_0_0_3px_rgb(var(--brand-rgb)/0.2)] focus:outline-none';

/** Reproduces Figma's icon frame: fixed box → glyph inset → stroke bleed → svg. */
function FigmaIcon({
  src,
  size,
  inset,
  bleed,
  className = '',
  style,
}: {
  src: string;
  size: number;
  inset: string;
  bleed: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={`relative block shrink-0 overflow-clip ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      <span className='absolute block' style={{ inset }}>
        <span className='absolute block' style={{ inset: bleed }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt='' src={src} className='block size-full max-w-none' />
        </span>
      </span>
    </span>
  );
}

function ZapIcon() {
  return <FigmaIcon src={ICONS.zap} size={14} inset='12.5% 22.92%' bleed='-7.14% -9.89%' />;
}

function CheckIcon({ size }: { size: number }) {
  return <FigmaIcon src={ICONS.check} size={size} inset='27.08% 20.83%' bleed='-10.23% -8.04%' />;
}

// Primary red button + response-time footer row, as on the homepage quote card.
function SubmitRow({
  label,
  type,
  onClick,
  disabled,
  busy,
  responseTime,
  noCard,
  whatsappHref,
  whatsappLabel,
}: {
  responseTime: string;
  noCard: string;
  // The business's WhatsApp chat link; when set, a second button sits beside the submit button.
  whatsappHref?: string;
  whatsappLabel: string;
  label: string;
  type: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className='flex w-full flex-col gap-3 sm:gap-[16px]'>
      <div className='flex w-full flex-col gap-3 sm:flex-row sm:items-stretch'>
        <motion.button
          {...PRESS}
          data-reveal-button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className='group relative flex h-[46px] w-full items-center justify-center gap-[10px] overflow-hidden rounded-[12px] border border-brand bg-brand py-0 pr-[21px] pl-[23px] drop-shadow-[0px_8px_14px_rgb(var(--brand-rgb)/0.35)] transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:flex-1 sm:rounded-[8px] sm:py-[11px]'
        >
          <RevealContent band='dark' className='gap-[10px]'>
            <AnimatePresence mode='wait' initial={false}>
              <motion.span
                key={busy ? 'busy' : 'idle'}
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                transition={{ duration: 0.16 }}
                className='flex shrink-0'
              >
                {busy ? (
                  <Loader2 aria-hidden className='size-[18px] animate-spin text-[#f1f3f6]' />
                ) : (
                  <FigmaIcon src={ICONS.quote} size={18} inset='8.33%' bleed='-3.75%' />
                )}
              </motion.span>
            </AnimatePresence>
            <span className='truncate text-[13px] leading-normal font-semibold tracking-[1.04px] text-[#f1f3f6] uppercase'>
              {label}
            </span>
            <FigmaIcon
              src={ICONS.arrow}
              size={24}
              inset='25% 37.5%'
              bleed='-6.25% -12.5%'
              className='transition-transform group-hover:translate-x-1'
            />
          </RevealContent>
        </motion.button>

        {whatsappHref && (
          <motion.a
            {...PRESS}
            href={whatsappHref}
            target='_blank'
            rel='noopener noreferrer'
            data-reveal-button
            className='relative flex h-[46px] w-full items-center justify-center overflow-hidden rounded-[12px] border border-[#3e4551] bg-[#2e343e] px-[21px] text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-[#f1f3f6] uppercase transition-colors hover:border-white/[0.28] hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:h-auto sm:w-auto sm:shrink-0 sm:rounded-[8px] sm:py-[11px]'
          >
            <RevealContent band='brand' className='gap-[10px]'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ICONS.whatsapp} alt='' width={22} height={22} className='block size-[22px] shrink-0' />
              {whatsappLabel}
            </RevealContent>
          </motion.a>
        )}
      </div>
      <div className='flex w-full flex-col items-center gap-2 text-[12px] leading-normal sm:flex-row sm:justify-between'>
        <span className='flex items-center gap-[6px] text-[#a4abb6]'>
          <ZapIcon />
          {responseTime}
        </span>
        <span className='text-[#7d8591]'>{noCard}</span>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  htmlFor,
  className = '',
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex w-full flex-col gap-1.5 sm:gap-[6px] ${className}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={FIELD_LABEL}>
          {label}
        </label>
      ) : (
        <span className={FIELD_LABEL}>{label}</span>
      )}
      {children}
    </div>
  );
}

interface QuoteFormProps {
  intro?: React.ReactNode;
  source?: 'quote_page' | 'homepage_estimator';
  // Editable in Settings > Forms & microcopy; the defaults are the original copy.
  copy: QuoteCopy;
  // The business's own WhatsApp number (for the "WhatsApp photos" button); no button when empty.
  whatsappNumber?: string | null;
}

// The quote form asks for two things: the customer's WhatsApp number and photos of the damage.
export function QuoteForm({ copy, intro, source = 'quote_page', whatsappNumber }: QuoteFormProps) {
  const { labels, placeholders, hints, buttons } = copy;
  const insurance = useInsuranceEnabled();

  const [phone, setPhone] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const photoCount = photos.length;

  // Submission State
  const [website, setWebsite] = useState('');
  const stamp = useEnquiryStamp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 5 || photos.length === 0) {
      setErrorMessage(copy.errors.required);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const converted = await Promise.all(photos.map(imageFileToDataUrl));
      const photoUrls = converted.filter((url): url is string => Boolean(url));
      if (photoUrls.length === 0) {
        setErrorMessage(copy.errors.required);
        return;
      }

      const eventId = newEventId();
      await submitQuoteRequest({
        phone: phone.trim(),
        photoUrls,
        source,
        eventId,
        sourcePath: window.location.pathname,
        website,
        stamp,
      });
      setSubmitted(true);
      try {
        track({
          event: 'generate_lead',
          params: { lead_source: 'quote_form', form_id: 'quote' },
          eventId,
        });
      } catch {
        // Tracking must never turn a saved lead into an error.
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : copy.errors.generic;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPhone('');
    setPhotos([]);
    setSubmitted(false);
  };

  return (
    <div className='flex w-full flex-col gap-12 lg:flex-row lg:items-stretch lg:gap-[80px]'>
      {/* Left column: the section's intro, then the check list and privacy note */}
      <aside className='flex w-full flex-col gap-[28px] lg:w-[480px] lg:shrink-0'>
        {intro}
        <ul className='flex w-full flex-col gap-[20px]'>
          {copy.benefits
            .filter((b) => visibleCopy(insurance, b.title, b.body))
            .map((b) => (
              <li key={b.title} data-popout className='flex w-full items-start gap-[16px]'>
                <span
                  data-popout-icon
                  className='flex shrink-0 items-center justify-center rounded-full bg-[#055e45] p-[6px]'
                >
                  <CheckIcon size={16} />
                </span>
                <span className='flex min-w-0 flex-1 flex-col gap-[4px]'>
                  <span className='text-[16px] leading-normal font-semibold text-[#f1f3f6]'>{b.title}</span>
                  <span className='text-[14px] leading-[22px] text-[#a4abb6]'>{b.body}</span>
                </span>
              </li>
            ))}
        </ul>
        <div
          data-popout
          className='flex w-full items-center gap-[12px] rounded-[12px] border border-[#2e343e] px-[16px] py-[14px]'
        >
          <FigmaIcon src={ICONS.shield} size={20} inset='8.33% 12.5%' bleed='-4.5% -5%' />
          <p className='min-w-0 flex-1 text-[13px] leading-[20px] text-[#a4abb6]'>{copy.privacyNote}</p>
        </div>
      </aside>

      <div
        data-quote-card
        className='flex w-full min-w-0 flex-col gap-[18px] rounded-[20px] border border-[#353c47] bg-[#262b34] p-4 sm:gap-[28px] sm:border-[#2e343e] sm:bg-[#20252d] sm:p-[24px] lg:flex-1'
      >
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className='flex flex-col items-center justify-center py-10 text-center'
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.12 }}
              className='mb-4 flex items-center justify-center rounded-full bg-[#055e45] p-[12px]'
            >
              <DrawCheck size={28} />
            </motion.span>
            <h2 className='font-site-heading text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-[#f1f3f6] uppercase'>
              {copy.success.title}
            </h2>
            <p className='mt-2 max-w-md text-[14px] leading-[22px] text-[#a4abb6]'>
              {fillCopy(copy.success.body, { phone })}
            </p>
            <button
              data-reveal-button
              type='button'
              onClick={handleReset}
              className='relative mt-6 overflow-hidden rounded-[8px] border border-[#353c47] px-5 py-2.5 text-[11px] tracking-[0.66px] text-[#d5d9e0] uppercase transition-colors hover:border-[#4e5663] hover:bg-[#2e343e] hover:text-[#f1f3f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
            >
              <RevealContent band='brand'>{buttons.another}</RevealContent>
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className='flex w-full flex-col gap-3 sm:gap-[16px] lg:flex-1'>
            {/* WhatsApp number */}
            <FieldGroup label={`${labels.whatsapp} *`} htmlFor='quote-whatsapp'>
              <input
                id='quote-whatsapp'
                type='tel'
                inputMode='tel'
                autoComplete='tel'
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={placeholders.whatsapp}
                className={FIELD_INPUT}
              />
              <p className='flex items-center gap-[6px] text-[12px] leading-normal text-[#7d8591]'>
                <ZapIcon />
                {hints.whatsapp}
              </p>
            </FieldGroup>

            {/* Photo dropzone */}
            <FieldGroup label={`${labels.photos} *`} className='lg:flex-1'>
              <label className='group flex w-full cursor-pointer flex-col items-center justify-center gap-[8px] rounded-[14px] border border-dashed border-[#4e5663] px-[16px] py-[12px] text-center transition-colors focus-within:border-brand hover:border-brand/70 hover:bg-[#20252d] sm:rounded-[12px] sm:px-[20px] sm:py-[14px] lg:flex-1'>
                <input
                  type='file'
                  accept='image/jpeg,image/png,image/heic'
                  multiple
                  className='sr-only'
                  onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS))}
                />
                <span className='flex items-center justify-center rounded-[12px] bg-[#2e343e] p-[8px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:scale-110'>
                  <FigmaIcon src={ICONS.upload} size={22} inset='12.5%' bleed='-4.55%' />
                </span>
                {photoCount > 0 ? (
                  <motion.span
                    key={photoCount}
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    className='text-[14px] leading-normal font-medium text-[#00d491]'
                  >
                    ✓ {photoCount} photo{photoCount > 1 ? 's' : ''} attached
                  </motion.span>
                ) : (
                  <span className='text-[14px] leading-normal font-medium text-[#f1f3f6]'>{hints.photoPrompt}</span>
                )}
                <span className='text-[10px] leading-normal tracking-[0.4px] text-[#7d8591] uppercase'>
                  {hints.photoTypes}
                </span>
              </label>
            </FieldGroup>

            <HoneypotField value={website} onChange={setWebsite} />
            {errorMessage && (
              <motion.p
                role='alert'
                className='text-[12px] text-brand-soft'
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {errorMessage}
              </motion.p>
            )}
            <SubmitRow
              label={isSubmitting ? buttons.submitting : buttons.submit}
              type='submit'
              responseTime={copy.responseTime}
              whatsappHref={whatsappNumber ? whatsappHref(whatsappNumber) : undefined}
              whatsappLabel={buttons.whatsapp}
              noCard={copy.noCard}
              disabled={isSubmitting}
              busy={isSubmitting}
            />
          </form>
        )}
      </div>
    </div>
  );
}
