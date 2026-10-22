'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { sizedSrc } from '@/lib/media/public-image';
import { imageFileToDataUrl } from '@/lib/image-to-data-url';
import { submitQuoteRequest } from '@/features/quote-requests/services/api';
import { track } from '@/lib/tracking/track';
import type { ServicePublic } from '@/features/services/types';
import type { GlobalValue } from '@/lib/content/globals';
import { fillCopy } from '@/components/marketing/ui/copy-template';

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
const FIELD_LABEL = 'block text-[11px] leading-normal tracking-[0.66px] text-[#a1a1a1] uppercase';
const FIELD_INPUT =
  'w-full rounded-[12px] border border-[#323232] bg-[#111113] px-[18px] py-[14px] text-[14px] text-white transition-colors placeholder:text-[#737373] focus:border-[#dc2626] focus:outline-none';
const BACK_LINK =
  'self-start text-[11px] leading-normal tracking-[0.66px] text-[#a1a1a1] uppercase transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none';

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
    <div className='flex w-full flex-col gap-[28px]'>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className='group flex w-full items-center justify-center gap-[10px] rounded-[8px] bg-[#dc2626] py-[16px] pr-[22px] pl-[24px] drop-shadow-[0px_8px_14px_rgba(220,38,38,0.35)] transition-colors hover:bg-[#b91c1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60'
      >
        {busy ? (
          <Loader2 aria-hidden className='size-[18px] shrink-0 animate-spin text-white' />
        ) : (
          <FigmaIcon src={ICONS.quote} size={18} inset='8.33%' bleed='-3.75%' />
        )}
        <span className='truncate text-[13px] leading-normal font-semibold tracking-[1.04px] text-white uppercase'>
          {label}
        </span>
        <FigmaIcon
          src={ICONS.arrow}
          size={24}
          inset='25% 37.5%'
          bleed='-6.25% -12.5%'
          className='transition-transform group-hover:translate-x-1'
        />
      </button>
      <div className='flex w-full flex-col items-center gap-2 text-[12px] leading-normal sm:flex-row sm:justify-between'>
        <span className='flex items-center gap-[6px] text-[#a1a1a1]'>
          <ZapIcon />
          {responseTime}
        </span>
        <span className='text-[#737373]'>{noCard}</span>
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
}: {
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
    <div className={`flex flex-col gap-[10px] ${className}`}>
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
        {required && ' *'}
      </label>
      <input
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
    <div className='flex w-full flex-col gap-[10px]'>
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
  services: ServicePublic[];
  // Editable in Settings > Forms & microcopy; the defaults are the original copy.
  copy: QuoteCopy;
}

export function QuoteForm({ services, copy }: QuoteFormProps) {
  const { labels, placeholders, hints, buttons } = copy;
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Vehicle & Service
  const [registration, setRegistration] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [selectedService, setSelectedService] = useState<string>(services[0]?.name ?? 'Crash & Collision Repair');

  // Step 2: Damage
  const [damageDescription, setDamageDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const photoCount = photos.length;

  // Step 3: Contact
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Submission State
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

      const eventId = crypto.randomUUID();
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
        source: 'quote_page',
        eventId,
        sourcePath: window.location.pathname,
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
    setRegistration('');
    setMake('');
    setModel('');
    setYear('');
    setDamageDescription('');
    setPhotos([]);
    setName('');
    setPhone('');
    setEmail('');
    setCurrentStep(1);
    setSubmitted(false);
  };

  const activeStep = submitted ? 3 : currentStep;

  return (
    <div className='flex w-full flex-col gap-12 lg:flex-row lg:items-start lg:gap-[80px]'>
      {/* Form card — mirrors the homepage estimator card */}
      <div className='flex w-full min-w-0 flex-col gap-[28px] rounded-[20px] border border-[#232328] bg-[#161616] p-5 sm:p-[36px] lg:flex-1'>
        {/* Stepper */}
        <ol className='flex w-full items-center gap-2 sm:gap-[14px]'>
          {copy.steps.map((label, idx) => {
            const s = { step: idx + 1, label: label.label, short: label.short };
            const isActive = activeStep === s.step;
            const isReached = activeStep >= s.step;
            const canGoBack = !submitted && s.step < currentStep;
            const content = (
              <>
                <span
                  className={`flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] leading-normal font-medium ${
                    isReached ? 'bg-[#dc2626] text-white' : 'border border-[#404040] text-[#a1a1a1]'
                  }`}
                >
                  {s.step}
                </span>
                <span
                  className={`text-[10px] leading-normal tracking-[0.44px] whitespace-nowrap uppercase sm:text-[11px] ${
                    isActive ? 'text-white' : 'text-[#737373]'
                  } ${canGoBack ? 'transition-colors group-hover:text-white' : ''}`}
                >
                  <span className='sm:hidden'>{s.short}</span>
                  <span className='hidden sm:inline'>{s.label}</span>
                </span>
              </>
            );
            return (
              <li key={s.step} className='contents' aria-current={isActive ? 'step' : undefined}>
                {idx > 0 && <span aria-hidden className='h-px min-w-2 flex-1 bg-[#323232]' />}
                {canGoBack ? (
                  <button
                    type='button'
                    onClick={() => setCurrentStep(s.step)}
                    className='group flex shrink-0 items-center gap-[6px] rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626] sm:gap-[10px]'
                  >
                    {content}
                  </button>
                ) : (
                  <span className='flex shrink-0 items-center gap-[6px] sm:gap-[10px]'>{content}</span>
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
            <h2 className='font-[family-name:var(--font-manrope)] text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-white uppercase'>
              {copy.success.title}
            </h2>
            <p className='mt-2 max-w-md text-[14px] leading-[22px] text-[#a1a1a1]'>
              {fillCopy(copy.success.body, {
                name,
                vehicle: [make, model].filter(Boolean).join(' ') || copy.success.vehicleFallback,
                phone,
              })}
            </p>
            <button
              type='button'
              onClick={handleReset}
              className='mt-6 rounded-[8px] border border-[#323232] px-5 py-2.5 text-[11px] tracking-[0.66px] text-[#d4d4d4] uppercase transition-colors hover:border-[#454545] hover:bg-[#232328] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626]'
            >
              {buttons.another}
            </button>
          </div>
        ) : currentStep === 1 ? (
          <>
            {/* Registration plate */}
            <FieldGroup label={labels.registration} htmlFor='quote-reg'>
              <div className='flex w-full items-center overflow-clip rounded-[12px] border border-[#323232] bg-[#111113] transition-colors focus-within:border-[#dc2626]'>
                <div className='flex shrink-0 flex-col items-center justify-center gap-[2px] self-stretch bg-[#2a2a2a] px-[14px] py-[12px] select-none'>
                  <span className='flex items-start gap-[2px]'>
                    <FigmaIcon src={ICONS.star} size={9} inset='8.33%' bleed='-5.83% -5.85% -5.85% -5.84%' />
                    <FigmaIcon src={ICONS.star} size={9} inset='8.33%' bleed='-5.83% -5.85% -5.85% -5.84%' />
                  </span>
                  <span className='text-[12px] leading-normal font-medium text-white'>IRL</span>
                </div>
                <input
                  id='quote-reg'
                  type='text'
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  placeholder={placeholders.registration}
                  className='w-full min-w-0 flex-1 bg-transparent px-3 py-[16px] font-[family-name:var(--font-manrope)] text-[18px] leading-normal font-bold tracking-[0.66px] text-white uppercase placeholder:text-[#737373] focus:outline-none sm:px-[18px] sm:text-[22px]'
                />
              </div>
              <p className='flex items-center gap-[6px] text-[12px] leading-normal text-[#737373]'>
                <ZapIcon />
                {hints.registration}
              </p>
            </FieldGroup>

            {/* Vehicle details */}
            <div className='grid grid-cols-1 gap-[20px] sm:grid-cols-3'>
              <FormField
                id='quote-make'
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

            {/* Service chips */}
            <FieldGroup label={labels.service}>
              <div className='grid w-full grid-cols-2 gap-[10px] sm:grid-cols-4' role='radiogroup'>
                {services.map((service) => {
                  const isSelected = service.name === selectedService;
                  return (
                    <button
                      key={service.id}
                      type='button'
                      role='radio'
                      aria-checked={isSelected}
                      onClick={() => setSelectedService(service.name)}
                      className={`flex min-w-0 flex-col items-center justify-center gap-[10px] rounded-[12px] border px-[12px] py-[16px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626] ${
                        isSelected
                          ? 'border-white bg-white text-black'
                          : 'border-[#323232] bg-[#111113] text-white hover:border-[#454545] hover:bg-[#16161a]'
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
            </FieldGroup>

            <SubmitRow
              label={buttons.continueToDamage}
              type='button'
              onClick={() => setCurrentStep(2)}
              responseTime={copy.responseTime}
              noCard={copy.noCard}
            />
          </>
        ) : currentStep === 2 ? (
          <>
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

            {/* Photo dropzone */}
            <FieldGroup label={labels.photos}>
              <label className='group flex w-full cursor-pointer flex-col items-center justify-center gap-[8px] rounded-[12px] border border-dashed border-[#454545] px-[20px] py-[28px] text-center transition-colors focus-within:border-[#dc2626] hover:border-[#dc2626]/70 hover:bg-[#1a1a1d]'>
                <input
                  type='file'
                  accept='image/jpeg,image/png,image/heic'
                  multiple
                  className='sr-only'
                  onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS))}
                />
                <span className='flex items-center justify-center rounded-[12px] bg-[#242424] p-[12px] transition-colors group-hover:bg-[#2e2e2e]'>
                  <FigmaIcon src={ICONS.upload} size={22} inset='12.5%' bleed='-4.55%' />
                </span>
                {photoCount > 0 ? (
                  <span className='text-[14px] leading-normal font-medium text-[#00d491]'>
                    ✓ {photoCount} photo{photoCount > 1 ? 's' : ''} attached
                  </span>
                ) : (
                  <span className='text-[14px] leading-normal font-medium text-white'>{hints.photoPrompt}</span>
                )}
                <span className='text-[10px] leading-normal tracking-[0.4px] text-[#737373] uppercase'>
                  {hints.photoTypes}
                </span>
              </label>
            </FieldGroup>

            <button type='button' onClick={() => setCurrentStep(1)} className={BACK_LINK}>
              {buttons.backToVehicle}
            </button>
            <SubmitRow
              label={buttons.continueToContact}
              type='button'
              onClick={() => setCurrentStep(3)}
              responseTime={copy.responseTime}
              noCard={copy.noCard}
            />
          </>
        ) : (
          <form onSubmit={handleSubmit} className='flex w-full flex-col gap-[28px]'>
            <div className='grid grid-cols-1 gap-[20px] sm:grid-cols-2'>
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
            <button type='button' onClick={() => setCurrentStep(2)} className={BACK_LINK}>
              {buttons.backToDamage}
            </button>
            {errorMessage && (
              <p role='alert' className='text-[12px] text-[#dc2626]'>
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

      {/* Reassurance column — same check list + privacy note as the homepage estimator */}
      <aside className='flex w-full flex-col gap-[28px] lg:w-[360px] lg:shrink-0 lg:pt-[36px]'>
        <ul className='flex w-full flex-col gap-[20px]'>
          {copy.benefits.map((b) => (
            <li key={b.title} className='flex w-full items-start gap-[16px]'>
              <span className='flex shrink-0 items-center justify-center rounded-full bg-[#055e45] p-[6px]'>
                <CheckIcon size={16} />
              </span>
              <span className='flex min-w-0 flex-1 flex-col gap-[4px]'>
                <span className='text-[16px] leading-normal font-semibold text-white'>{b.title}</span>
                <span className='text-[14px] leading-[22px] text-[#a1a1a1]'>{b.body}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className='flex w-full items-center gap-[12px] rounded-[12px] border border-[#232328] px-[16px] py-[14px]'>
          <FigmaIcon src={ICONS.shield} size={20} inset='8.33% 12.5%' bleed='-4.5% -5%' />
          <p className='min-w-0 flex-1 text-[13px] leading-[20px] text-[#a1a1a1]'>{copy.privacyNote}</p>
        </div>
      </aside>
    </div>
  );
}
