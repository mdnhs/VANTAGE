'use client';

import { visibleCopy } from '@/lib/features';
import { RevealContent } from '@/components/marketing/ui/reveal-content';
import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { sizedSrc } from '@/lib/media/public-image';
import { imageFileToDataUrl } from '@/lib/image-to-data-url';
import { submitQuoteRequest } from '@/features/quote-requests/services/api';
import { track } from '@/lib/tracking/track';
import type { ServicePublic } from '@/features/services/types';
import type { GlobalValue } from '@/lib/content/globals';
import { fillCopy } from '@/components/marketing/ui/copy-template';
import { newEventId } from '@/lib/tracking/event-id';
import { HoneypotField } from '@/components/marketing/honeypot-field';
import { useEnquiryStamp } from '@/features/enquiries/hooks/use-enquiry-stamp';

const DEFAULT_SERVICE_ICON = '/assets/marketing/icon-crash-repair.svg';

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

function FormField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  className = '',
  inputRef,
}: {
  inputRef?: React.Ref<HTMLInputElement>;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 sm:gap-[6px] ${className}`}>
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
        {required && ' *'}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FIELD_INPUT}
      />
    </div>
  );
}

function FieldGroup({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className='flex w-full flex-col gap-1.5 sm:gap-[6px]'>
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
  services: ServicePublic[];
  // Editable in Settings > Forms & microcopy; the defaults are the original copy.
  copy: QuoteCopy;
}

export function QuoteForm({ services, copy, intro, source = 'quote_page' }: QuoteFormProps) {
  const { labels, placeholders, hints, buttons } = copy;

  // Step 1: Vehicle & Service
  const [registration, setRegistration] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [selectedService, setSelectedService] = useState<string>(services[0]?.name ?? 'Crash & Collision Repair');

  // There is no registration lookup service: the search button hands over to the make field.
  const makeRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const carouselRef = useRef<HTMLDivElement>(null);
  // One form, three stops: the stepper follows where the visitor is and what they have filled in.
  const [focusedStep, setFocusedStep] = useState(1);

  // Step 2: Damage
  const [damageDescription, setDamageDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const photoCount = photos.length;

  // Step 3: Contact
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Submission State
  const [website, setWebsite] = useState('');
  const stamp = useEnquiryStamp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage(copy.errors.required);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const converted = await Promise.all(photos.map(imageFileToDataUrl));
      const photoUrls = converted.filter((url): url is string => Boolean(url));

      const eventId = newEventId();
      await submitQuoteRequest({
        name,
        phone,
        email,
        registration: registration.trim() || null,
        make: make.trim() || null,
        model: model.trim() || null,
        year: year ? parseInt(year, 10) : null,
        serviceType: selectedService,
        description: damageDescription.trim() || null,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
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

  const stepDone = [
    registration.trim() !== '',
    [make, model, year, damageDescription].some((v) => v.trim() !== ''),
    name.trim() !== '' && phone.trim() !== '' && email.trim() !== '',
  ];
  const goToStep = (n: number) => {
    setFocusedStep(n);
    const section = document.getElementById(`${uid}-step-${n}`);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section
      ?.querySelector<HTMLElement>('input:not([type=file]):not([tabindex="-1"]), textarea')
      ?.focus({ preventScroll: true });
  };

  const handleReset = () => {
    setRegistration('');
    setMake('');
    setModel('');
    setYear('');
    setDamageDescription('');
    setPhotos([]);
    setName('');
    setPhone('');
    setEmail('');
    setFocusedStep(1);
    setSubmitted(false);
  };

  return (
    <div className='flex w-full flex-col gap-12 lg:flex-row lg:items-start lg:gap-[80px]'>
      {/* Left column: the section's intro, then the check list and privacy note */}
      <aside className='flex w-full flex-col gap-[28px] lg:w-[480px] lg:shrink-0'>
        {intro}
        <ul className='flex w-full flex-col gap-[20px]'>
          {copy.benefits
            .filter((b) => visibleCopy(b.title, b.body))
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
        <ol className='sticky top-20 z-10 -mx-1 flex w-full items-center gap-2 bg-inherit px-1 py-1 sm:static sm:mx-0 sm:gap-[14px] sm:p-0'>
          {copy.steps.map((label, idx) => {
            const n = idx + 1;
            const isActive = !submitted && focusedStep === n;
            const isReached = submitted || isActive || stepDone[idx];
            const content = (
              <>
                <span
                  className={`flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] leading-normal font-medium transition-colors ${
                    isReached ? 'bg-brand text-[#f1f3f6]' : 'border border-[#4e5663] text-[#a4abb6]'
                  }`}
                >
                  {n}
                </span>
                <span
                  className={`text-[10px] leading-normal tracking-[0.44px] whitespace-nowrap uppercase transition-colors sm:text-[11px] ${
                    isActive ? 'text-[#f1f3f6]' : 'text-[#7d8591] group-hover:text-[#f1f3f6]'
                  }`}
                >
                  <span className='sm:hidden'>{label.short}</span>
                  <span className='hidden sm:inline'>{label.label}</span>
                </span>
              </>
            );
            return (
              <li key={n} className='contents' aria-current={isActive ? 'step' : undefined}>
                {idx > 0 && <span aria-hidden className='h-px min-w-2 flex-1 bg-[#353c47]' />}
                {submitted ? (
                  <span className='flex shrink-0 items-center gap-[6px] sm:gap-[10px]'>{content}</span>
                ) : (
                  <button
                    type='button'
                    onClick={() => goToStep(n)}
                    className='group flex shrink-0 cursor-pointer items-center gap-[6px] rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:gap-[10px]'
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        {submitted ? (
          <div className='flex flex-col items-center justify-center py-10 text-center'>
            <span className='mb-4 flex items-center justify-center rounded-full bg-[#055e45] p-[12px]'>
              <CheckIcon size={28} />
            </span>
            <h2 className='font-site-heading text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-[#f1f3f6] uppercase'>
              {copy.success.title}
            </h2>
            <p className='mt-2 max-w-md text-[14px] leading-[22px] text-[#a4abb6]'>
              {fillCopy(copy.success.body, {
                name,
                vehicle: [make, model].filter(Boolean).join(' ') || copy.success.vehicleFallback,
                phone,
              })}
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
          <form onSubmit={handleSubmit} className='flex w-full flex-col gap-3 sm:gap-[16px]'>
            <div
              id={`${uid}-step-1`}
              onFocusCapture={() => setFocusedStep(1)}
              className='flex w-full scroll-mt-24 flex-col gap-3 sm:gap-[16px]'
            >
              {/* Registration plate */}
              <FieldGroup label={labels.registration} htmlFor='quote-reg'>
                <div className='flex w-full items-center overflow-clip rounded-[12px] border border-[#3e4551] bg-[#1b1f26] pr-[6px] transition-colors focus-within:border-brand'>
                  <div className='flex shrink-0 flex-col items-center justify-center gap-[2px] self-stretch border-r border-[#3e4551] bg-[#2e343e] px-[12px] py-[6px] select-none'>
                    <span className='flex items-start gap-[2px]'>
                      <FigmaIcon src={ICONS.star} size={9} inset='8.33%' bleed='-5.83% -5.85% -5.85% -5.84%' />
                      <FigmaIcon src={ICONS.star} size={9} inset='8.33%' bleed='-5.83% -5.85% -5.85% -5.84%' />
                    </span>
                    <span className='text-[12px] leading-normal font-medium text-[#f1f3f6]'>IRL</span>
                  </div>
                  <input
                    id='quote-reg'
                    type='text'
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                    placeholder={placeholders.registration}
                    className='w-full min-w-0 flex-1 bg-transparent px-3 py-[10px] font-site-heading text-[18px] leading-normal font-bold tracking-[0.66px] text-[#f1f3f6] uppercase placeholder:text-[16px] placeholder:font-medium placeholder:tracking-[0.3px] placeholder:text-[#7d8591] focus:outline-none sm:px-[14px] sm:text-[20px] sm:placeholder:text-[14px]'
                  />
                  <button
                    type='button'
                    aria-label={buttons.lookup}
                    onClick={() => makeRef.current?.focus()}
                    className='flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-[#2e343e] text-[#a4abb6] transition-colors hover:bg-[#3e4551] hover:text-[#f1f3f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
                  >
                    <Search aria-hidden className='size-[18px]' />
                  </button>
                </div>
                <p className='flex items-center gap-[6px] text-[12px] leading-normal text-[#7d8591]'>
                  <ZapIcon />
                  {hints.registration}
                </p>
              </FieldGroup>

              {/* Service chips */}
              <FieldGroup label={labels.service}>
                <div className='relative w-full'>
                  <div
                    ref={carouselRef}
                    role='radiogroup'
                    aria-label={labels.service}
                    className='flex w-full snap-x snap-mandatory [scrollbar-width:none] gap-[10px] overflow-x-auto scroll-smooth pb-1 [&::-webkit-scrollbar]:hidden'
                  >
                    {services.map((service) => {
                      const isSelected = service.name === selectedService;
                      return (
                        <button
                          key={service.id}
                          type='button'
                          role='radio'
                          aria-checked={isSelected}
                          onClick={() => setSelectedService(service.name)}
                          className={`flex w-[calc((100%-10px)/2)] shrink-0 snap-start flex-col items-center justify-center gap-[6px] rounded-[12px] border px-[10px] py-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-[calc((100%-30px)/4)] ${
                            isSelected
                              ? 'border-[#f1f3f6] bg-[#f1f3f6] text-black'
                              : 'border-[#353c47] bg-[#1b1f26] text-[#f1f3f6] hover:border-[#4e5663] hover:bg-[#20252d]'
                          }`}
                        >
                          <Image
                            src={service.icon ? sizedSrc(service.icon, 'w_48,h_48') : DEFAULT_SERVICE_ICON}
                            alt=''
                            width={24}
                            height={24}
                            // CMS icons vary in colour; force them monochrome so they track the chip state.
                            className={`size-6 brightness-0 ${isSelected ? '' : 'invert'}`}
                          />
                          <span className='text-center text-[13px] leading-[18px] font-medium'>{service.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {services.length > 2 && (
                    <div className='pointer-events-none absolute inset-x-0 top-0 bottom-1 flex items-center justify-between'>
                      {([-1, 1] as const).map((dir) => (
                        <button
                          key={dir}
                          type='button'
                          aria-label={dir < 0 ? 'Previous categories' : 'Next categories'}
                          onClick={() =>
                            carouselRef.current?.scrollBy({ left: dir * carouselRef.current.clientWidth * 0.8 })
                          }
                          className={`pointer-events-auto flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#4e5663] bg-[#1b1f26]/95 text-[#f1f3f6] shadow-[0_4px_12px_rgb(0_0_0/0.4)] transition-colors hover:bg-[#2e343e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${dir < 0 ? '-ml-3' : '-mr-3'}`}
                        >
                          {dir < 0 ? (
                            <ChevronLeft aria-hidden className='size-4' />
                          ) : (
                            <ChevronRight aria-hidden className='size-4' />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </FieldGroup>

              {/* Photo dropzone */}
              <FieldGroup label={labels.photos}>
                <label className='group flex w-full cursor-pointer flex-col items-center justify-center gap-[8px] rounded-[14px] border border-dashed border-[#4e5663] px-[16px] py-[12px] text-center transition-colors focus-within:border-brand hover:border-brand/70 hover:bg-[#20252d] sm:rounded-[12px] sm:px-[20px] sm:py-[14px]'>
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
            </div>
            <div
              id={`${uid}-step-2`}
              onFocusCapture={() => setFocusedStep(2)}
              className='flex w-full scroll-mt-24 flex-col gap-3 sm:gap-[16px]'
            >
              {/* Vehicle details: the plate's lookup lands here */}
              <div className='grid grid-cols-1 gap-[12px] sm:grid-cols-3'>
                <FormField
                  id='quote-make'
                  inputRef={makeRef}
                  label={labels.make}
                  value={make}
                  onChange={setMake}
                  placeholder={placeholders.make}
                />
                <FormField
                  id='quote-model'
                  label={labels.model}
                  value={model}
                  onChange={setModel}
                  placeholder={placeholders.model}
                />
                <FormField
                  id='quote-year'
                  label={labels.year}
                  value={year}
                  onChange={setYear}
                  placeholder={placeholders.year}
                  type='number'
                />
              </div>

              <FieldGroup label={labels.damage} htmlFor='quote-damage'>
                <textarea
                  id='quote-damage'
                  rows={5}
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder={placeholders.damage}
                  className={`${FIELD_INPUT} resize-y leading-[22px]`}
                />
              </FieldGroup>
            </div>
            <HoneypotField value={website} onChange={setWebsite} />
            <div id={`${uid}-step-3`} onFocusCapture={() => setFocusedStep(3)} className='scroll-mt-24'>
              <div className='grid grid-cols-1 gap-[12px] sm:grid-cols-2'>
                <FormField
                  id='quote-name'
                  label={labels.name}
                  value={name}
                  onChange={setName}
                  placeholder={placeholders.name}
                  required
                />
                <FormField
                  id='quote-phone'
                  label={labels.phone}
                  value={phone}
                  onChange={setPhone}
                  placeholder={placeholders.phone}
                  type='tel'
                  required
                />
                <FormField
                  id='quote-email'
                  label={labels.email}
                  value={email}
                  onChange={setEmail}
                  placeholder={placeholders.email}
                  type='email'
                  required
                  className='sm:col-span-2'
                />
              </div>
            </div>
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
