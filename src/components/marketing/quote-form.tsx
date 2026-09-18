'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';
import { submitQuoteRequest } from '@/features/quote-requests/services/api';
import type { ServicePublic } from '@/features/services/types';

const DEFAULT_SERVICE_ICON = '/assets/marketing/icon-crash-repair.svg';

const STEPS = [
  { step: 1, label: '01 Vehicle' },
  { step: 2, label: '02 Damage' },
  { step: 3, label: '03 Contact' },
];

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
    <div className='flex flex-col gap-2'>
      <label className='text-xs font-semibold tracking-[1.2px] text-neutral-300 uppercase'>
        {label} {required && <span className='text-red-400'>*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full rounded-t-lg border-b border-white/10 bg-[#131313] px-4 py-5 text-lg text-[#e5e2e1] uppercase placeholder-neutral-500 outline-none focus:border-red-500'
      />
    </div>
  );
}

interface QuoteFormProps {
  services: ServicePublic[];
}

export function QuoteForm({ services }: QuoteFormProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Vehicle & Service
  const [registration, setRegistration] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [selectedService, setSelectedService] = useState<string>(services[0]?.name ?? 'Crash & Collision Repair');

  // Step 2: Damage
  const [damageDescription, setDamageDescription] = useState('');

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
      setErrorMessage('Please fill in your name, phone number, and email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
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
        source: 'quote_page',
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit quote request. Please try again.';
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
    setName('');
    setPhone('');
    setEmail('');
    setCurrentStep(1);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className='relative flex flex-col items-center justify-center gap-6 rounded-2xl bg-[#1c1b1b] px-6 py-16 text-center shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] sm:px-12'>
        <div className='flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400'>
          <CheckCircle2 className='size-10' />
        </div>
        <div className='max-w-md'>
          <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold text-white uppercase'>
            Quote Request Received!
          </h2>
          <p className='mt-3 text-sm leading-relaxed text-neutral-300'>
            Thank you, <strong className='text-white'>{name}</strong>! Our Dublin master technicians have received your
            details for{' '}
            <strong className='text-white'>{[make, model].filter(Boolean).join(' ') || 'your vehicle'}</strong>. We will
            contact you at <strong className='text-white'>{phone}</strong> within 48 minutes with your estimate.
          </p>
        </div>

        <button
          type='button'
          onClick={handleReset}
          className='mt-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-mono text-xs tracking-wider text-white uppercase transition-colors hover:bg-white/20'
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className='relative flex flex-col gap-8 rounded-2xl bg-[#1c1b1b] px-4 py-8 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] sm:gap-10 sm:px-12 sm:py-12'>
      <div className='absolute inset-0 rounded-2xl bg-white/2 backdrop-blur-md' />

      {/* Steps Header */}
      <div className='relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6'>
        <div className='flex items-center gap-2'>
          <span className='flex size-7 items-center justify-center rounded-full bg-[#dc2626] text-xs font-bold tracking-[0.6px] text-white shadow-[0px_0px_15px_rgba(220,38,38,0.4)] sm:size-8'>
            0{currentStep}
          </span>
          <span className='pl-2 font-[family-name:var(--font-manrope)] text-lg text-[#e5e2e1] sm:text-2xl'>
            {currentStep === 1 ? 'Vehicle Details' : currentStep === 2 ? 'Damage Details' : 'Contact Information'}
          </span>
        </div>

        <div className='flex gap-3 sm:gap-6'>
          {STEPS.map((s) => (
            <button
              key={s.step}
              type='button'
              onClick={() => {
                if (s.step < currentStep) setCurrentStep(s.step);
              }}
              className={`text-[11px] font-semibold tracking-wider uppercase transition-opacity sm:text-xs ${
                currentStep === s.step
                  ? 'font-bold text-[#dc2626] underline underline-offset-4 opacity-100'
                  : currentStep > s.step
                    ? 'cursor-pointer text-neutral-400 opacity-80'
                    : 'cursor-default text-neutral-500 opacity-40'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Vehicle & Primary Service */}
      {currentStep === 1 && (
        <div className='relative flex flex-col gap-8'>
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2'>
            <div className='relative'>
              <FormField
                label='Registration Plate'
                value={registration}
                onChange={setRegistration}
                placeholder='e.g. 231-D-48912'
              />
              <Image
                src='/assets/marketing/icon-registration-plate.svg'
                alt=''
                width={18}
                height={16}
                className='pointer-events-none absolute top-[46px] right-4 h-4 w-[18px]'
              />
            </div>
            <FormField label='Vehicle Make' value={make} onChange={setMake} placeholder='e.g. BMW / Audi / Porsche' />
            <FormField label='Vehicle Model' value={model} onChange={setModel} placeholder='e.g. 3 Series / M4' />
            <FormField label='Year' value={year} onChange={setYear} placeholder='YYYY' type='number' />
          </div>

          <div className='h-px w-full bg-white/10' />

          <div className='flex flex-col gap-4'>
            <span className='text-xs font-semibold tracking-[1.2px] text-neutral-300 uppercase'>
              Primary Service Required
            </span>

            <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
              {services.map((service) => {
                const isSelected = service.name === selectedService;
                return (
                  <button
                    key={service.id}
                    type='button'
                    onClick={() => setSelectedService(service.name)}
                    className={
                      isSelected
                        ? 'flex h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-[#dc2626] bg-[#201f1f] shadow-[0px_4px_15px_rgba(220,38,38,0.3)]'
                        : 'flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#131313] transition-colors hover:border-white/20'
                    }
                  >
                    <Image
                      src={
                        service.iconPublicId
                          ? cldUrl(service.iconPublicId, { width: 48, height: 48 })
                          : DEFAULT_SERVICE_ICON
                      }
                      alt=''
                      width={24}
                      height={24}
                      className='size-6'
                    />
                    <span className='px-2 text-center text-xs font-medium text-[#e5e2e1]'>{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className='flex justify-end pt-4'>
            <button
              type='button'
              onClick={() => setCurrentStep(2)}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-[#dc2626] px-8 py-4 text-xs font-semibold tracking-[1.2px] text-white uppercase shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-colors hover:bg-red-700 sm:w-auto'
            >
              <span>Continue to Damage Details</span>
              <ArrowRight className='size-4' />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Damage Description */}
      {currentStep === 2 && (
        <div className='relative flex flex-col gap-8'>
          <div className='flex flex-col gap-3'>
            <label className='text-xs font-semibold tracking-[1.2px] text-neutral-300 uppercase'>
              Describe the Vehicle Damage &amp; Location
            </label>
            <textarea
              rows={5}
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              placeholder='e.g. Scrape along passenger side front bumper and wing from parking incident. Original paint is creased...'
              className='w-full rounded-lg border border-white/10 bg-[#131313] p-4 text-base text-[#e5e2e1] placeholder-neutral-500 outline-none focus:border-red-500'
            />
          </div>

          <div className='flex flex-col-reverse gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between'>
            <button
              type='button'
              onClick={() => setCurrentStep(1)}
              className='flex items-center justify-center gap-2 py-2 font-mono text-xs text-neutral-400 uppercase transition-colors hover:text-white sm:justify-start'
            >
              <ArrowLeft className='size-3.5' />
              Back to Vehicle Details
            </button>

            <button
              type='button'
              onClick={() => setCurrentStep(3)}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-[#dc2626] px-8 py-4 text-xs font-semibold tracking-[1.2px] text-white uppercase shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-colors hover:bg-red-700 sm:w-auto'
            >
              <span>Continue to Contact</span>
              <ArrowRight className='size-4' />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Contact & Submit */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className='relative flex flex-col gap-8'>
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2'>
            <FormField label='Your Full Name' value={name} onChange={setName} placeholder='e.g. Liam Murphy' required />
            <FormField
              label='Phone Number'
              value={phone}
              onChange={setPhone}
              placeholder='e.g. +353 87 123 4567'
              type='tel'
              required
            />
            <div className='sm:col-span-2'>
              <FormField
                label='Email Address'
                value={email}
                onChange={setEmail}
                placeholder='e.g. liam@example.ie'
                type='email'
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className='flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400'>
              <AlertCircle className='size-4' />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className='flex flex-col-reverse gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between'>
            <button
              type='button'
              onClick={() => setCurrentStep(2)}
              className='flex items-center justify-center gap-2 py-2 font-mono text-xs text-neutral-400 uppercase transition-colors hover:text-white sm:justify-start'
            >
              <ArrowLeft className='size-3.5' />
              Back to Damage Details
            </button>

            <button
              type='submit'
              disabled={isSubmitting}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-[#dc2626] px-8 py-4 text-xs font-semibold tracking-[1.2px] text-white uppercase shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] transition-colors hover:bg-red-700 disabled:opacity-60 sm:w-auto'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='size-4 animate-spin' />
                  <span>Submitting Request…</span>
                </>
              ) : (
                <>
                  <span>Send Free Quote Request</span>
                  <ArrowRight className='size-4' />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
