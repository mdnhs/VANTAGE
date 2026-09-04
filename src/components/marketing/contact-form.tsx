'use client';

import { useRef, useState, type DragEvent } from 'react';
import Image from 'next/image';

const SERVICES = ['Crash Repair', 'Dent Repair', 'Scratch Repair', 'Precision Paintwork', 'Restoration', 'Other'];

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className='flex flex-1 flex-col gap-2'>
      <label className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full rounded-t-[2px] border-b border-white/10 bg-[#1a1a1a] px-3 py-3.5 text-base text-[#e5e2e1] placeholder-[#9ca3af] outline-none focus:border-[#ffb4ab]'
      />
    </div>
  );
}

export function ContactForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  }

  return (
    <div className='relative motion-preset-slide-up overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 px-6 py-10 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md motion-delay-150 motion-duration-700 sm:px-12 sm:py-12'>
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ffb4ab]/5 via-transparent to-transparent' />

      <div className='relative flex flex-col gap-8'>
        <div className='flex flex-col gap-2'>
          <h2 className='font-[family-name:var(--font-manrope)] text-2xl font-semibold tracking-[-0.6px] text-[#e5e2e1] uppercase'>
            Send an Enquiry
          </h2>
          <p className='text-base text-[#e6bdb8]'>
            Provide details about your vehicle and repair needs for an accurate assessment.
          </p>
        </div>

        <div className='flex flex-col gap-6 sm:flex-row'>
          <FormField label='First Name' value={firstName} onChange={setFirstName} placeholder='John' />
          <FormField label='Last Name' value={lastName} onChange={setLastName} placeholder='Doe' />
        </div>

        <div className='flex flex-col gap-6 sm:flex-row'>
          <FormField
            label='Email Address'
            value={email}
            onChange={setEmail}
            placeholder='john@example.com'
            type='email'
          />
          <FormField label='Phone Number' value={phone} onChange={setPhone} placeholder='+353 ...' type='tel' />
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>Service Required</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className='w-full rounded-t-[2px] border-b border-white/10 bg-[#1a1a1a] px-3 py-3 text-base text-[#e5e2e1] outline-none focus:border-[#ffb4ab]'
          >
            <option value=''>Select a service...</option>
            {SERVICES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>Message Details</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Describe the damage or required work...'
            rows={4}
            className='w-full resize-none rounded-t-[2px] border-b border-white/10 bg-[#1a1a1a] px-3 py-3 text-base text-[#e5e2e1] placeholder-[#9ca3af] outline-none focus:border-[#ffb4ab]'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>
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
              isDragging ? 'border-[#ffb4ab] bg-[#1a1a1a]' : 'border-white/10 bg-[#1a1a1a]/50'
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
              <button type='button' onClick={() => fileInputRef.current?.click()} className='text-[#ffb4ab] underline'>
                browse
              </button>
            </p>
            <span className='text-xs font-semibold tracking-[0.6px] text-[#e6bdb8]'>Max 5MB per file (JPG, PNG)</span>
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
            <ul className='flex flex-col gap-1 pt-2'>
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className='text-sm text-[#e6bdb8]'>
                  {file.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className='flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-4 sm:flex-row sm:items-center'>
          <span className='max-w-[200px] text-xs font-semibold tracking-[0.6px] text-[#e6bdb8]'>
            We aim to respond to all enquiries within 24 hours.
          </span>
          <button
            type='button'
            className='group flex items-center gap-2 rounded bg-[#ffb4ab] px-8 py-4 text-xs font-semibold tracking-[1.2px] text-[#690005] uppercase shadow-[0px_4px_10px_rgba(220,38,38,0.15)] transition-all hover:-translate-y-1 hover:opacity-90'
          >
            Submit Enquiry
            <Image
              src='/assets/marketing/icon-submit-arrow.svg'
              alt=''
              width={13}
              height={13}
              className='size-[13px] transition-transform duration-300 group-hover:translate-x-1'
            />
          </button>
        </div>
      </div>
    </div>
  );
}
