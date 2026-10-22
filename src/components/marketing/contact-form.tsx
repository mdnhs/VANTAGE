'use client';

import { useState, type CSSProperties, type DragEvent } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { ServicePublic } from '@/features/services/types';
import { submitContactMessage } from '@/features/contact-messages/services/api';

// Figma-exported glyphs shared with the homepage quote form (stitch-estimator.tsx, node 131:204).
const ICONS = {
  check: '/assets/landing/af900d3d05a78ce1eaa2cfe4e4134d654de6e007.svg',
  zap: '/assets/landing/fd10f2e7d9775f83bb5963cf33996d15acaf6164.svg',
  upload: '/assets/landing/d67c13a6cce7df3d3e67ee755b356d94c1f1ca8e.svg',
  quote: '/assets/landing/77f4614fe4f24a8e612134c222c8e6b222b0af4f.svg',
  arrow: '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg',
};

// Field classes copied from the homepage quote form so both forms read identically.
const FIELD_LABEL = 'block text-[11px] leading-normal tracking-[0.66px] text-[#a1a1a1] uppercase';
const FIELD_INPUT =
  'w-full rounded-[12px] border border-[#323232] bg-[#111113] px-[18px] py-[14px] text-[14px] text-white transition-colors placeholder:text-[#737373] focus:border-[#dc2626] focus:outline-none';

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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className='flex min-w-0 flex-col gap-[10px]'>
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
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ContactForm({ services }: ContactFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Convert attached files to base64 strings if any
      const photoUrls: string[] = [];
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const dataUrl = await readFileAsDataUrl(file);
          photoUrls.push(dataUrl);
        }
      }

      await submitContactMessage({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service: service || null,
        message: message.trim(),
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
        source: 'contact_page',
      });

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit enquiry. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Panel surface matches the homepage quote form card.
  const panel =
    'flex w-full min-w-0 flex-col gap-[28px] rounded-[20px] border border-[#232328] bg-[#161616] p-5 sm:p-[36px]';

  if (submitted) {
    return (
      <div className={panel}>
        <div className='flex flex-col items-center justify-center py-10 text-center'>
          <span className='mb-4 flex items-center justify-center rounded-full bg-[#055e45] p-[12px]'>
            <FigmaIcon src={ICONS.check} size={28} inset='27.08% 20.83%' bleed='-10.23% -8.04%' />
          </span>
          <h3 className='font-[family-name:var(--font-manrope)] text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-white uppercase'>
            Enquiry received
          </h3>
          <p className='mt-2 max-w-md text-[14px] leading-[22px] text-[#a1a1a1]'>
            Thank you, <span className='font-semibold text-white'>{firstName}</span>! We have received your message. Our
            Dublin specialists will review your enquiry and get back to you within 24 hours.
          </p>
          <button
            type='button'
            onClick={handleReset}
            className='mt-6 rounded-[8px] border border-[#323232] px-5 py-2.5 text-[11px] tracking-[0.66px] text-[#d4d4d4] uppercase transition-colors hover:border-[#454545] hover:bg-[#232328] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626]'
          >
            ← Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={panel}>
      <div className='flex flex-col gap-2'>
        <h3 className='font-[family-name:var(--font-manrope)] text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-white uppercase'>
          Send an enquiry
        </h3>
        <p className='text-[14px] leading-[22px] text-[#a1a1a1]'>
          Provide details about your vehicle and repair needs for an accurate assessment.
        </p>
      </div>

      {errorMessage && (
        <div
          role='alert'
          className='flex items-center gap-2 rounded-[12px] border border-[#dc2626]/40 bg-[#dc2626]/10 px-4 py-3 text-[13px] text-[#fca5a5]'
        >
          <AlertCircle aria-hidden className='size-4 shrink-0 text-[#dc2626]' />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className='grid grid-cols-1 gap-[20px] sm:grid-cols-2'>
        <FormField label='First Name' value={firstName} onChange={setFirstName} placeholder='John' required />
        <FormField label='Last Name' value={lastName} onChange={setLastName} placeholder='Doe' required />
        <FormField
          label='Email Address'
          value={email}
          onChange={setEmail}
          placeholder='john@example.com'
          type='email'
          required
        />
        <FormField label='Phone Number' value={phone} onChange={setPhone} placeholder='+353 ...' type='tel' required />
      </div>

      <label className='flex flex-col gap-[10px]'>
        <span className={FIELD_LABEL}>Service Required</span>
        <select value={service} onChange={(e) => setService(e.target.value)} className={FIELD_INPUT}>
          <option value=''>Select a service...</option>
          {services.map((option) => (
            <option key={option.id} value={option.name}>
              {option.name}
            </option>
          ))}
          <option value='Other'>Other</option>
        </select>
      </label>

      <label className='flex flex-col gap-[10px]'>
        <span className={FIELD_LABEL}>Message Details *</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder='Describe the damage or required work...'
          rows={4}
          required
          className={`${FIELD_INPUT} resize-none`}
        />
      </label>

      <div className='flex w-full flex-col gap-[10px]'>
        <span className={FIELD_LABEL}>Upload Images (Optional)</span>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`group flex w-full cursor-pointer flex-col items-center justify-center gap-[8px] rounded-[12px] border border-dashed px-[20px] py-[28px] text-center transition-colors focus-within:border-[#dc2626] hover:border-[#dc2626]/70 hover:bg-[#1a1a1d] ${
            isDragging ? 'border-[#dc2626] bg-[#1a1a1d]' : 'border-[#454545]'
          }`}
        >
          <input
            type='file'
            accept='image/jpeg,image/png'
            multiple
            className='sr-only'
            onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
          />
          <span className='flex items-center justify-center rounded-[12px] bg-[#242424] p-[12px] transition-colors group-hover:bg-[#2e2e2e]'>
            <FigmaIcon src={ICONS.upload} size={22} inset='12.5%' bleed='-4.55%' />
          </span>
          <span className='text-[14px] leading-normal font-medium text-white'>
            Tap to upload photos or drag &amp; drop here
          </span>
          <span className='text-[10px] leading-normal tracking-[0.4px] text-[#737373] uppercase'>
            JPG or PNG · Max 5MB per file
          </span>
        </label>
        {files.length > 0 && (
          <ul className='flex flex-wrap gap-2 pt-1'>
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className='flex items-center gap-2 rounded-full border border-[#323232] bg-[#111113] py-1 pr-1.5 pl-3 text-[12px] text-[#d4d4d4]'
              >
                <span className='max-w-[200px] truncate'>{file.name}</span>
                <button
                  type='button'
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                  className='flex size-5 items-center justify-center rounded-full text-[#a1a1a1] transition-colors hover:bg-[#232328] hover:text-white focus-visible:outline-2 focus-visible:outline-[#dc2626]'
                >
                  <X aria-hidden className='size-3' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit row — same button + meta line as the homepage quote form. */}
      <div className='flex w-full flex-col gap-[28px]'>
        <button
          type='submit'
          disabled={isSubmitting}
          className='group flex w-full items-center justify-center gap-[10px] rounded-[8px] bg-[#dc2626] py-[16px] pr-[22px] pl-[24px] drop-shadow-[0px_8px_14px_rgba(220,38,38,0.35)] transition-colors hover:bg-[#b91c1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60'
        >
          {isSubmitting ? (
            <Loader2 aria-hidden className='size-[18px] animate-spin text-white' />
          ) : (
            <FigmaIcon src={ICONS.quote} size={18} inset='8.33%' bleed='-3.75%' />
          )}
          <span className='text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-white uppercase'>
            {isSubmitting ? 'Submitting…' : 'Submit enquiry'}
          </span>
          <FigmaIcon
            src={ICONS.arrow}
            size={24}
            inset='25% 37.5%'
            bleed='-6.25% -12.5%'
            className='transition-transform group-hover:translate-x-1'
          />
        </button>
        <p className='flex items-center justify-center gap-[6px] text-center text-[12px] leading-normal text-[#a1a1a1]'>
          <FigmaIcon src={ICONS.zap} size={14} inset='12.5% 22.92%' bleed='-7.14% -9.89%' />
          We aim to respond to all enquiries within 24 hours.
        </p>
      </div>
    </form>
  );
}
