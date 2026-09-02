'use client';

import { useState } from 'react';
import Image from 'next/image';

const SERVICES = [
  { id: 'collision', label: 'Collision Repair', icon: '/assets/marketing/icon-service-collision.svg' },
  { id: 'paint', label: 'Paint & Finish', icon: '/assets/marketing/icon-service-paint.svg' },
  { id: 'restoration', label: 'Restoration', icon: '/assets/marketing/icon-service-restoration.svg' },
  { id: 'detailing', label: 'Detailing', icon: '/assets/marketing/icon-service-detailing.svg' },
] as const;

const UPCOMING_STEPS = ['02 Damage', '03 Photos', '04 Contact'];

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
    <div className='flex flex-col gap-2'>
      <label className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full rounded-t-lg border-b border-[rgba(92,64,60,0.3)] bg-[#131313] px-4 py-5 text-lg text-[#e5e2e1] uppercase placeholder-[rgba(230,189,184,0.3)] outline-none focus:border-[#ffb4ab]'
      />
    </div>
  );
}

export function QuoteForm() {
  const [registration, setRegistration] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [selectedService, setSelectedService] = useState<(typeof SERVICES)[number]['id']>('collision');

  return (
    <div className='relative flex flex-col gap-12 rounded-2xl bg-[#1c1b1b] px-6 py-12 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] sm:px-12'>
      <div className='absolute inset-0 rounded-2xl bg-white/2 backdrop-blur-md' />

      <div className='relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center'>
        <div className='flex items-center gap-2'>
          <span className='flex size-8 items-center justify-center rounded-full bg-[#ffb4ab] text-xs font-bold tracking-[0.6px] text-[#690005] shadow-[0px_4px_10px_rgba(220,38,38,0.15)]'>
            01
          </span>
          <span className='pl-2 font-[family-name:var(--font-manrope)] text-2xl text-[#e5e2e1]'>Vehicle</span>
        </div>

        <div className='hidden items-center gap-3 lg:flex'>
          {[0, 1, 2].map((i) => (
            <div key={i} className='flex items-center gap-3'>
              <span className='h-px w-16 bg-[#5c403c]/30' />
              <span className='size-2 rounded-full bg-[#353534]' />
            </div>
          ))}
          <span className='h-px w-16 bg-[#5c403c]/30' />
        </div>

        <div className='flex gap-6 opacity-40'>
          {UPCOMING_STEPS.map((step) => (
            <span key={step} className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>
              {step}
            </span>
          ))}
        </div>
      </div>

      <div className='relative flex flex-col gap-8'>
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2'>
          <div className='relative'>
            <FormField
              label='Registration Plate'
              value={registration}
              onChange={setRegistration}
              placeholder='e.g. AB12 CDE'
            />
            <Image
              src='/assets/marketing/icon-registration-plate.svg'
              alt=''
              width={18}
              height={16}
              className='pointer-events-none absolute top-[46px] right-4 h-4 w-[18px]'
            />
          </div>
          <FormField label='Vehicle Make' value={make} onChange={setMake} placeholder='e.g. Porsche' />
          <FormField label='Vehicle Model' value={model} onChange={setModel} placeholder='e.g. 911 GT3' />
          <FormField label='Year' value={year} onChange={setYear} placeholder='YYYY' type='number' />
        </div>

        <div className='h-px w-full bg-[rgba(92,64,60,0.2)]' />

        <div className='flex flex-col gap-4'>
          <span className='text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>
            Primary Service Required
          </span>

          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            {SERVICES.map((service) => {
              const isSelected = service.id === selectedService;
              return (
                <button
                  key={service.id}
                  type='button'
                  onClick={() => setSelectedService(service.id)}
                  className={
                    isSelected
                      ? 'flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-[#ffb4ab] bg-[#201f1f] shadow-[0px_4px_10px_rgba(220,38,38,0.1)]'
                      : 'flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-[rgba(92,64,60,0.1)] bg-[#131313] transition-colors hover:border-[rgba(92,64,60,0.3)]'
                  }
                >
                  <Image src={service.icon} alt='' width={24} height={24} className='size-6' />
                  <span className='text-base font-medium text-[#e5e2e1]'>{service.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className='flex justify-end pt-4'>
          <button
            type='button'
            className='flex items-center gap-2 rounded-lg bg-[#ffb4ab] px-8 py-4 text-xs font-semibold tracking-[1.2px] text-[#690005] uppercase shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-90'
          >
            Continue to Damage
            <Image src='/assets/marketing/icon-cta-arrow.svg' alt='' width={16} height={16} className='size-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
