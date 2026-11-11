'use client';

import { useInsuranceEnabled } from '@/contexts/insurance-context';
import { visibleCopy } from '@/lib/features';
import { RevealContent } from '@/components/marketing/ui/reveal-content';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { imageFileToDataUrl } from '@/lib/image-to-data-url';
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
};

const MAX_PHOTOS = 4;

type QuoteCopy = GlobalValue<'quoteForm'>;

// Field classes copied from the homepage estimator so both forms read identically.
const FIELD_LABEL =
  'block text-[12px] leading-normal tracking-[0.48px] text-[#a4abb6] uppercase sm:text-[11px] sm:tracking-[0.66px]';
const FIELD_INPUT =
  'w-full rounded-[12px] border border-[#3e4551] bg-[#2e343e] px-[12px] py-[10px] text-[16px] text-[#f1f3f6] sm:border-[#353c47] sm:bg-[#1b1f26] sm:px-[14px] sm:text-[14px] transition-colors placeholder:text-[#7d8591] focus:border-brand focus:outline-none';

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
}: {
  responseTime: string;
  noCard: string;
  label: string;
  type: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className='flex w-full flex-col gap-3 sm:gap-[16px]'>
      <button
        data-reveal-button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className='group relative flex h-[46px] w-full items-center justify-center gap-[10px] overflow-hidden rounded-[12px] border border-brand bg-brand py-0 pr-[21px] pl-[23px] drop-shadow-[0px_8px_14px_rgb(var(--brand-rgb)/0.35)] transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:rounded-[8px] sm:py-[11px]'
      >
        <RevealContent band='dark' className='gap-[10px]'>
          {busy ? (
            <Loader2 aria-hidden className='size-[18px] shrink-0 animate-spin text-[#f1f3f6]' />
          ) : (
            <FigmaIcon src={ICONS.quote} size={18} inset='8.33%' bleed='-3.75%' />
          )}
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
      </button>
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
}

// The quote form asks for two things: the customer's WhatsApp number and photos of the damage.
export function QuoteForm({ copy, intro, source = 'quote_page' }: QuoteFormProps) {
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
          <div className='flex flex-col items-center justify-center py-10 text-center'>
            <span className='mb-4 flex items-center justify-center rounded-full bg-[#055e45] p-[12px]'>
              <CheckIcon size={28} />
            </span>
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
          </div>
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
                <span className='flex items-center justify-center rounded-[12px] bg-[#2e343e] p-[8px] transition-colors group-hover:bg-[#2e343e]'>
                  <FigmaIcon src={ICONS.upload} size={22} inset='12.5%' bleed='-4.55%' />
                </span>
                {photoCount > 0 ? (
                  <span className='text-[14px] leading-normal font-medium text-[#00d491]'>
                    ✓ {photoCount} photo{photoCount > 1 ? 's' : ''} attached
                  </span>
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
              <p role='alert' className='text-[12px] text-brand-soft'>
                {errorMessage}
              </p>
            )}
            <SubmitRow
              label={isSubmitting ? buttons.submitting : buttons.submit}
              type='submit'
              responseTime={copy.responseTime}
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
