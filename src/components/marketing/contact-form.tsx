'use client';

import { RevealContent } from '@/components/marketing/ui/reveal-content';
import { useState, type CSSProperties, type DragEvent } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { ServicePublic } from '@/features/services/types';
import type { GlobalValue } from '@/lib/content/globals';
import { fillCopy } from '@/components/marketing/ui/copy-template';
import { imageFileToDataUrl } from '@/lib/image-to-data-url';
import { submitContactMessage } from '@/features/contact-messages/services/api';
import { track } from '@/lib/tracking/track';
import { newEventId } from '@/lib/tracking/event-id';
import { HoneypotField } from '@/components/marketing/honeypot-field';
import { useEnquiryStamp } from '@/features/enquiries/hooks/use-enquiry-stamp';

// Figma-exported glyphs shared with the homepage quote form (stitch-estimator.tsx, node 131:204).
const ICONS = {
  check: '/assets/landing/af900d3d05a78ce1eaa2cfe4e4134d654de6e007.svg',
  zap: '/assets/landing/fd10f2e7d9775f83bb5963cf33996d15acaf6164.svg',
  upload: '/assets/landing/d67c13a6cce7df3d3e67ee755b356d94c1f1ca8e.svg',
  quote: '/assets/landing/77f4614fe4f24a8e612134c222c8e6b222b0af4f.svg',
  arrow: '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg',
};

// Field classes copied from the homepage quote form so both forms read identically.
const FIELD_LABEL =
  'block text-[12px] leading-normal tracking-[0.48px] text-[#a4abb6] uppercase sm:text-[11px] sm:tracking-[0.66px]';
const FIELD_INPUT =
  'w-full rounded-[12px] border border-[#3e4551] bg-[#2e343e] px-[14px] py-[14px] text-[16px] text-[#f1f3f6] sm:border-[#353c47] sm:bg-[#1b1f26] sm:px-[18px] sm:text-[14px] lg:text-[15px] transition-colors placeholder:text-[#7d8591] focus:border-brand focus:outline-none';

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

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  className = '',
}: {
  className?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-2 sm:gap-[10px] ${className}`}>
      <span className={FIELD_LABEL}>
        {label}
        {required && ' *'}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={FIELD_INPUT}
      />
    </label>
  );
}

interface ContactFormProps {
  services: ServicePublic[];
  // Editable in Settings > Forms & microcopy; the defaults are the original copy.
  copy: GlobalValue<'contactForm'>;
}

export function ContactForm({ services, copy }: ContactFormProps) {
  const { labels, placeholders } = copy;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [website, setWebsite] = useState('');
  const stamp = useEnquiryStamp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  }

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setService('');
    setMessage('');
    setFiles([]);
    setErrorMessage(null);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      setErrorMessage(copy.errors.required);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Convert attached files to base64 strings if any
      const photoUrls: string[] = [];
      for (const file of files.slice(0, 4)) {
        if (file.type.startsWith('image/')) {
          const dataUrl = await imageFileToDataUrl(file);
          if (dataUrl) photoUrls.push(dataUrl);
        }
      }

      const eventId = newEventId();
      await submitContactMessage({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service: service || null,
        message: message.trim(),
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
        source: 'contact_page',
        eventId,
        sourcePath: window.location.pathname,
        website,
        stamp,
      });

      setSubmitted(true);
      try {
        track({
          event: 'generate_lead',
          params: { lead_source: 'contact_form', form_id: 'contact' },
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

  // Panel surface matches the homepage quote form card.
  const panel =
    'flex w-full min-w-0 flex-col gap-[18px] rounded-[20px] border border-[#353c47] bg-[#262b34] p-5 sm:gap-[28px] sm:border-[#2e343e] sm:bg-[#20252d] sm:p-[36px] lg:gap-[22px] lg:p-10';

  if (submitted) {
    return (
      <div className={panel}>
        <div className='flex flex-col items-center justify-center py-10 text-center'>
          <span className='mb-4 flex items-center justify-center rounded-full bg-[#055e45] p-[12px]'>
            <FigmaIcon src={ICONS.check} size={28} inset='27.08% 20.83%' bleed='-10.23% -8.04%' />
          </span>
          <h3 className='font-site-heading text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-[#f1f3f6] uppercase'>
            {copy.success.title}
          </h3>
          <p className='mt-2 max-w-md text-[14px] leading-[22px] text-[#a4abb6]'>
            {fillCopy(copy.success.body, { name: firstName })}
          </p>
          <button
            data-reveal-button
            type='button'
            onClick={handleReset}
            className='relative mt-6 overflow-hidden rounded-[8px] border border-[#353c47] px-5 py-2.5 text-[11px] tracking-[0.66px] text-[#d5d9e0] uppercase transition-colors hover:border-[#4e5663] hover:bg-[#2e343e] hover:text-[#f1f3f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
          >
            <RevealContent band='brand'>{copy.sendAnother}</RevealContent>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={panel}>
      <HoneypotField value={website} onChange={setWebsite} />
      <div className='flex flex-col gap-2 lg:gap-[22px]'>
        <h3 className='font-site-heading text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-[#f1f3f6] uppercase lg:text-[32px] lg:leading-[38px] lg:tracking-[-0.64px]'>
          {copy.title}
        </h3>
        <p className='text-[14px] leading-[22px] text-[#a4abb6] lg:text-[15px] lg:leading-6'>{copy.intro}</p>
      </div>

      {errorMessage && (
        <div
          role='alert'
          className='flex items-center gap-2 rounded-[12px] border border-brand/40 bg-brand/10 px-4 py-3 text-[13px] text-brand-soft'
        >
          <AlertCircle aria-hidden className='size-4 shrink-0 text-brand' />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className='grid grid-cols-2 gap-x-[10px] gap-y-[18px] sm:gap-[20px] lg:gap-x-4 lg:gap-y-[22px]'>
        <FormField
          label={labels.firstName}
          value={firstName}
          onChange={setFirstName}
          placeholder={placeholders.firstName}
          required
        />
        <FormField
          label={labels.lastName}
          value={lastName}
          onChange={setLastName}
          placeholder={placeholders.lastName}
          required
        />
        <FormField
          label={labels.email}
          value={email}
          onChange={setEmail}
          placeholder={placeholders.email}
          type='email'
          className='col-span-2 sm:col-span-1'
          required
        />
        <FormField
          label={labels.phone}
          value={phone}
          onChange={setPhone}
          placeholder={placeholders.phone}
          type='tel'
          className='col-span-2 sm:col-span-1'
          required
        />
      </div>

      <label className='flex flex-col gap-2 sm:gap-[10px]'>
        <span className={FIELD_LABEL}>{labels.service}</span>
        <select value={service} onChange={(e) => setService(e.target.value)} className={FIELD_INPUT}>
          <option value=''>{placeholders.service}</option>
          {services.map((option) => (
            <option key={option.id} value={option.name}>
              {option.name}
            </option>
          ))}
          <option value='Other'>{placeholders.other}</option>
        </select>
      </label>

      <label className='flex flex-col gap-2 sm:gap-[10px]'>
        <span className={FIELD_LABEL}>{labels.message} *</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholders.message}
          rows={4}
          required
          className={`${FIELD_INPUT} resize-none`}
        />
      </label>

      <div className='flex w-full flex-col gap-2 sm:gap-[10px]'>
        <span className={FIELD_LABEL}>{labels.photos}</span>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`group flex w-full cursor-pointer flex-col items-center justify-center gap-[8px] rounded-[14px] border border-dashed px-[16px] py-[20px] text-center transition-colors focus-within:border-brand hover:border-brand/70 hover:bg-[#20252d] sm:rounded-[12px] sm:px-[20px] sm:py-[28px] ${
            isDragging ? 'border-brand bg-[#20252d]' : 'border-[#4e5663]'
          }`}
        >
          <input
            type='file'
            accept='image/jpeg,image/png'
            multiple
            className='sr-only'
            onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
          />
          <span className='flex items-center justify-center rounded-[12px] bg-[#2e343e] p-[12px] transition-colors group-hover:bg-[#2e343e]'>
            <FigmaIcon src={ICONS.upload} size={22} inset='12.5%' bleed='-4.55%' />
          </span>
          <span className='text-[14px] leading-normal font-medium text-[#f1f3f6]'>{copy.dropzone.prompt}</span>
          <span className='text-[10px] leading-normal tracking-[0.4px] text-[#7d8591] uppercase'>
            {copy.dropzone.hint}
          </span>
        </label>
        {files.length > 0 && (
          <ul className='flex flex-wrap gap-2 pt-1'>
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className='flex items-center gap-2 rounded-full border border-[#353c47] bg-[#1b1f26] py-1 pr-1.5 pl-3 text-[12px] text-[#d5d9e0]'
              >
                <span className='max-w-[200px] truncate'>{file.name}</span>
                <button
                  type='button'
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                  className='flex size-5 items-center justify-center rounded-full text-[#a4abb6] transition-colors hover:bg-[#2e343e] hover:text-[#f1f3f6] focus-visible:outline-2 focus-visible:outline-brand'
                >
                  <X aria-hidden className='size-3' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit row — same button + meta line as the homepage quote form. */}
      <div className='flex w-full flex-col gap-[18px] sm:gap-[28px] lg:gap-[22px]'>
        <button
          data-reveal-button
          type='submit'
          disabled={isSubmitting}
          className='group relative flex h-[52px] w-full items-center justify-center gap-[10px] overflow-hidden rounded-[12px] border border-brand bg-brand py-0 pr-[21px] pl-[23px] drop-shadow-[0px_8px_14px_rgb(var(--brand-rgb)/0.35)] transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 sm:h-auto sm:rounded-[8px] sm:py-[15px]'
        >
          <RevealContent band='dark' className='gap-[10px]'>
            {isSubmitting ? (
              <Loader2 aria-hidden className='size-[18px] animate-spin text-[#f1f3f6]' />
            ) : (
              <FigmaIcon src={ICONS.quote} size={18} inset='8.33%' bleed='-3.75%' />
            )}
            <span className='text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-[#f1f3f6] uppercase'>
              {isSubmitting ? copy.submitting : copy.button}
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
        <p className='flex items-center justify-center gap-[6px] text-center text-[12px] leading-normal text-[#a4abb6] lg:justify-start lg:text-left lg:text-[13px] lg:text-[#7d8591]'>
          <FigmaIcon src={ICONS.zap} size={14} inset='12.5% 22.92%' bleed='-7.14% -9.89%' />
          {copy.responseNote}
        </p>
      </div>
    </form>
  );
}
