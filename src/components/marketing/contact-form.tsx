'use client';

import { useRef, useState, type DragEvent } from 'react';
import Image from 'next/image';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { ServicePublic } from '@/features/services/types';
import { submitContactMessage } from '@/features/contact-messages/services/api';

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
    <div className='flex flex-1 flex-col gap-2'>
      <label className='text-xs font-semibold tracking-[1.2px] text-neutral-300 uppercase'>
        {label} {required && <span className='text-red-400'>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className='w-full rounded-t-[2px] border-b border-white/10 bg-[#1a1a1a] px-3 py-3.5 text-base text-[#e5e2e1] placeholder-[#9ca3af] outline-none focus:border-red-500'
      />
    </div>
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
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

  if (submitted) {
    return (
      <div className='relative motion-preset-slide-up overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 px-6 py-16 text-center shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md sm:px-12'>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent' />
        <div className='relative mx-auto flex max-w-md flex-col items-center gap-6'>
          <div className='flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400'>
            <CheckCircle2 className='size-8' />
          </div>
          <div className='flex flex-col gap-2'>
            <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-white uppercase'>
              Enquiry Received
            </h2>
            <p className='text-sm leading-relaxed text-neutral-300'>
              Thank you, <span className='font-semibold text-white'>{firstName}</span>! We have received your message.
              Our Dublin specialists will review your enquiry and get back to you within 24 hours.
            </p>
          </div>
          <button
            type='button'
            onClick={handleReset}
            className='mt-2 rounded bg-white/10 px-6 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-white/20'
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='relative motion-preset-slide-up overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 px-4 py-8 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md motion-delay-150 motion-duration-700 sm:px-12 sm:py-12'
    >
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-transparent' />

      <div className='relative flex flex-col gap-8'>
        <div className='flex flex-col gap-2'>
          <h2 className='font-[family-name:var(--font-manrope)] text-2xl font-semibold tracking-[-0.6px] text-[#e5e2e1] uppercase'>
            Send an Enquiry
          </h2>
          <p className='text-base text-neutral-400'>
            Provide details about your vehicle and repair needs for an accurate assessment.
          </p>
        </div>

        {errorMessage && (
          <div className='flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300'>
            <AlertCircle className='size-4 shrink-0 text-red-400' />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className='flex flex-col gap-6 sm:flex-row'>
          <FormField label='First Name' value={firstName} onChange={setFirstName} placeholder='John' required />
          <FormField label='Last Name' value={lastName} onChange={setLastName} placeholder='Doe' required />
        </div>

        <div className='flex flex-col gap-6 sm:flex-row'>
          <FormField
            label='Email Address'
            value={email}
            onChange={setEmail}
            placeholder='john@example.com'
            type='email'
            required
          />
          <FormField
            label='Phone Number'
            value={phone}
            onChange={setPhone}
            placeholder='+353 ...'
            type='tel'
            required
          />
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-xs font-semibold tracking-[1.2px] text-neutral-300 uppercase'>Service Required</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className='w-full rounded-t-[2px] border-b border-white/10 bg-[#1a1a1a] px-3 py-3 text-base text-[#e5e2e1] outline-none focus:border-red-500'
          >
            <option value=''>Select a service...</option>
            {services.map((option) => (
              <option key={option.id} value={option.name}>
                {option.name}
              </option>
            ))}
            <option value='Other'>Other</option>
          </select>
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-xs font-semibold tracking-[1.2px] text-neutral-300 uppercase'>
            Message Details <span className='text-red-400'>*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Describe the damage or required work...'
            rows={4}
            required
            className='w-full resize-none rounded-t-[2px] border-b border-white/10 bg-[#1a1a1a] px-3 py-3 text-base text-[#e5e2e1] placeholder-[#9ca3af] outline-none focus:border-red-500'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-xs font-semibold tracking-[1.2px] text-neutral-300 uppercase'>
            Upload Images (Optional)
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragging ? 'border-red-500 bg-[#1a1a1a]' : 'border-white/10 bg-[#1a1a1a]/50'
            }`}
          >
            <Image
              src='/assets/marketing/icon-upload-cloud.svg'
              alt=''
              width={33}
              height={32}
              className={`h-8 w-[33px] transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}
            />
            <p className='text-base text-[#e5e2e1]'>
              Drag &amp; drop photos here or{' '}
              <button type='button' onClick={() => fileInputRef.current?.click()} className='text-red-500 underline'>
                browse
              </button>
            </p>
            <span className='text-xs font-semibold tracking-[0.6px] text-neutral-400'>Max 5MB per file (JPG, PNG)</span>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png'
              multiple
              className='hidden'
              onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            />
          </div>
          {files.length > 0 && (
            <div className='flex flex-wrap gap-2 pt-2'>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className='flex items-center gap-2 rounded bg-white/5 px-2.5 py-1 text-xs text-neutral-300'
                >
                  <span className='max-w-[200px] truncate'>{file.name}</span>
                  <button
                    type='button'
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    className='text-red-400 hover:text-red-300'
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex flex-col items-stretch justify-between gap-4 border-t border-white/5 pt-4 sm:flex-row sm:items-center'>
          <span className='text-center text-xs font-semibold tracking-[0.6px] text-neutral-400 sm:text-left'>
            We aim to respond to all enquiries within 24 hours.
          </span>
          <button
            type='submit'
            disabled={isSubmitting}
            className='group flex w-full items-center justify-center gap-2 rounded bg-[#dc2626] px-8 py-4 text-xs font-bold tracking-[1.2px] text-white uppercase shadow-[0_4px_20px_rgba(220,38,38,0.35)] transition-all hover:-translate-y-1 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='size-3.5 animate-spin' />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Enquiry</span>
                <Image
                  src='/assets/marketing/icon-submit-arrow.svg'
                  alt=''
                  width={13}
                  height={13}
                  className='size-[13px] transition-transform duration-300 group-hover:translate-x-1'
                />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
