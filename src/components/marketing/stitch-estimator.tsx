'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Search,
  BadgeCheck,
  CarFront,
  Bandage,
  PaintRoller,
  Disc,
  Camera,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'collision', label: 'Collision', icon: CarFront },
  { id: 'pdr', label: 'Dent / PDR', icon: Bandage },
  { id: 'respray', label: 'Respray', icon: PaintRoller },
  { id: 'wheel', label: 'Alloy Wheel', icon: Disc },
];

const STEPS = ['Vehicle & Reg', 'Damage Type', 'Photos & Contact'];

function SubmitRow({ label, type, onClick }: { label: string; type: 'button' | 'submit'; onClick?: () => void }) {
  return (
    <div className='pt-2'>
      <button
        type={type}
        onClick={onClick}
        className='group flex w-full items-center justify-center gap-2 rounded bg-[#dc2626] py-4 text-xs font-bold tracking-widest text-white uppercase shadow-[0_4px_25px_rgba(220,38,38,0.45)] transition-all hover:bg-red-700'
      >
        <span>{label}</span>
        <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
      </button>
      <div className='mt-3 flex items-center justify-between font-mono text-[11px] text-neutral-400'>
        <span>
          ⚡ Average response time: <strong>48 minutes</strong>
        </span>
        <span>No card required</span>
      </div>
    </div>
  );
}

interface ContactFieldProps {
  label: string;
  type: 'text' | 'tel' | 'email';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function ContactField({ label, type, placeholder, value, onChange }: ContactFieldProps) {
  return (
    <label className='block'>
      <span className='mb-2 block font-mono text-xs tracking-wider text-neutral-300 uppercase'>{label} *</span>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full rounded-md border border-white/20 bg-black px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#dc2626] focus:outline-none'
      />
    </label>
  );
}

export function StitchEstimator() {
  const [showContact, setShowContact] = useState(false);
  const [regNumber, setRegNumber] = useState('231-D-48912');
  const [vehicleFound, setVehicleFound] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('collision');
  const [photoCount, setPhotoCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Form contact state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleLookup = () => {
    setIsLookingUp(true);
    setTimeout(() => {
      setIsLookingUp(false);
      setVehicleFound('2023 BMW M4 Competition Coupe • Portimao Blue (C31)');
    }, 600);
  };

  const activeStep = submitted ? 3 : showContact ? 3 : 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id='estimator' className='relative w-full overflow-hidden border-y border-white/10 bg-[#111111] py-24'>
      {/* Background glow */}
      <div className='pointer-events-none absolute top-1/2 right-0 size-96 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl' />

      <div className='container mx-auto px-6 sm:px-12'>
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-12'>
          {/* Left Column */}
          <div className='intersect-once flex flex-col gap-6 lg:col-span-5 intersect:motion-preset-slide-right'>
            <span className='flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-[#dc2626] uppercase'>
              <span className='h-px w-6 bg-[#dc2626]' />
              2-Minute Online Quotation
            </span>
            <h2 className='font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-tight text-white uppercase lg:text-[40px] lg:leading-[48px]'>
              Show Us The Damage. <br />
              <span className='text-[#dc2626]'>We&apos;ll Provide The Cost.</span>
            </h2>
            <p className='text-base leading-6 text-neutral-300'>
              No need to take time off work or drive in with damage. Upload three photos and our Dublin estimators will
              issue an itemized, insurer-compatible quote with estimated workshop completion dates.
            </p>

            <div className='space-y-4 pt-2'>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-emerald-400' />
                <div>
                  <div className='text-sm font-semibold text-white'>No-Obligation &amp; 100% Free</div>
                  <div className='text-sm text-neutral-400'>Clear breakdown of parts, labor, and paint costs.</div>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-emerald-400' />
                <div>
                  <div className='text-sm font-semibold text-white'>Direct Insurance Support</div>
                  <div className='text-sm text-neutral-400'>
                    We work directly with your insurer so you don&apos;t pay out-of-pocket.
                  </div>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-emerald-400' />
                <div>
                  <div className='text-sm font-semibold text-white'>Replacement Car Provision</div>
                  <div className='text-sm text-neutral-400'>
                    Keep moving while your vehicle is in our Dublin workshop.
                  </div>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4'>
              <Lock className='size-6 shrink-0 text-[#dc2626]' />
              <div className='text-sm text-neutral-300'>
                <strong className='text-white'>Privacy Guarantee:</strong> Your registration and contact details are
                strictly used for your vehicle quote calculation.
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3-Step Card */}
          <div className='intersect-once motion-delay-150 lg:col-span-7 intersect:motion-preset-slide-left'>
            <div className='relative rounded-xl border border-white/15 bg-[#181818] p-6 shadow-2xl sm:p-8'>
              {/* Steps Bar */}
              <div className='mb-6 flex items-center justify-between border-b border-white/10 pb-6'>
                {STEPS.map((label, idx) => {
                  const step = idx + 1;
                  const isActive = activeStep === step;
                  const isReached = activeStep >= step;
                  return (
                    <div key={label} className='contents'>
                      {idx > 0 && <div className='hidden h-px w-8 bg-white/20 sm:block' />}
                      <div className='flex items-center gap-2'>
                        <span
                          className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold ${
                            isReached ? 'bg-[#dc2626] text-white' : 'bg-white/10 text-neutral-300'
                          }`}
                        >
                          {step}
                        </span>
                        <span
                          className={`text-xs tracking-wider uppercase ${
                            isActive ? 'font-bold text-white' : 'font-medium text-neutral-400'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {submitted ? (
                <div className='flex flex-col items-center justify-center py-10 text-center'>
                  <div className='mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400'>
                    <ShieldCheck className='size-8' />
                  </div>
                  <h3 className='font-[family-name:var(--font-manrope)] text-2xl font-bold text-white uppercase'>
                    Estimate Request Logged
                  </h3>
                  <p className='mt-2 max-w-md text-sm text-neutral-300'>
                    Our Dublin estimating team will review your vehicle details ({regNumber}) and dispatch your itemized
                    quote within 2 business hours.
                  </p>
                  <button
                    type='button'
                    onClick={() => {
                      setSubmitted(false);
                      setShowContact(false);
                    }}
                    className='mt-6 flex items-center gap-2 rounded border border-white/20 px-5 py-2.5 font-mono text-xs text-neutral-300 uppercase transition-colors hover:bg-white/10 hover:text-white'
                  >
                    <RotateCcw className='size-3.5' /> New Estimate
                  </button>
                </div>
              ) : !showContact ? (
                <div className='space-y-6'>
                  {/* Irish License Plate Input */}
                  <div>
                    <label
                      htmlFor='estimator-reg'
                      className='mb-2 block font-mono text-xs tracking-wider text-neutral-300 uppercase'
                    >
                      Irish Registration Number
                    </label>
                    <div className='flex items-center overflow-hidden rounded-md border border-white/20 bg-black shadow-inner transition-all focus-within:border-[#dc2626]'>
                      <div className='flex flex-col items-center justify-center border-r border-white/10 bg-[#003399] px-3.5 py-3 text-white select-none'>
                        <span className='text-[10px] leading-none tracking-tight'>★ ★</span>
                        <span className='mt-0.5 text-[11px] font-bold tracking-widest'>IRL</span>
                      </div>
                      <input
                        id='estimator-reg'
                        type='text'
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                        placeholder='e.g. 241-D-12345'
                        className='w-full bg-transparent px-4 py-3 font-mono text-lg font-bold tracking-widest text-white uppercase placeholder:text-neutral-600 focus:outline-none'
                      />
                      <button
                        type='button'
                        onClick={handleLookup}
                        className='flex items-center gap-1 border-l border-white/10 bg-white/10 px-4 py-3 font-mono text-xs text-neutral-300 uppercase transition-colors hover:bg-white/20'
                      >
                        <Search className='size-3.5' />
                        {isLookingUp ? 'Searching' : 'Lookup'}
                      </button>
                    </div>
                    {vehicleFound ? (
                      <p className='mt-1.5 flex items-center gap-1 text-[11px] text-emerald-400'>
                        <BadgeCheck className='size-3' /> Identified: {vehicleFound}
                      </p>
                    ) : (
                      <p className='mt-1.5 flex items-center gap-1 text-[11px] text-neutral-500'>
                        <BadgeCheck className='size-3 text-emerald-500' /> Auto-fills Year, Make, Model &amp; OEM Paint
                        Code
                      </p>
                    )}
                  </div>

                  {/* Damage Category Selector Chips */}
                  <div>
                    <span className='mb-2.5 block font-mono text-xs tracking-wider text-neutral-300 uppercase'>
                      Primary Repair Category
                    </span>
                    <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4' role='radiogroup'>
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type='button'
                            role='radio'
                            aria-checked={isSelected}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`rounded border p-3 text-center transition-all ${
                              isSelected
                                ? 'border-[#dc2626] bg-[#dc2626]/15 text-white'
                                : 'border-white/15 bg-white/[0.03] text-neutral-400 hover:border-white/40'
                            }`}
                          >
                            <Icon className='mx-auto mb-1 size-5' />
                            <span className='block text-[11px] font-semibold tracking-wider uppercase'>
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div>
                    <span className='mb-2 block font-mono text-xs tracking-wider text-neutral-300 uppercase'>
                      Upload Damage Photos (Up to 4 Angles)
                    </span>
                    <label className='group block cursor-pointer rounded-lg border-2 border-dashed border-white/15 bg-black/40 p-6 text-center transition-colors hover:border-[#dc2626]/60'>
                      <input
                        type='file'
                        accept='image/jpeg,image/png,image/heic'
                        multiple
                        className='sr-only'
                        onChange={(e) => setPhotoCount(Math.min(e.target.files?.length ?? 0, 4))}
                      />
                      <Camera className='mx-auto mb-2 size-[30px] text-neutral-400 transition-colors group-hover:text-[#dc2626]' />
                      {photoCount > 0 ? (
                        <div className='font-mono text-xs text-emerald-400'>
                          ✓ {photoCount} photo{photoCount > 1 ? 's' : ''} attached
                        </div>
                      ) : (
                        <>
                          <div className='text-xs font-semibold text-white'>
                            Tap to upload photos or drag &amp; drop here
                          </div>
                          <div className='mt-1 text-[11px] text-neutral-500'>
                            JPEG, PNG or HEIC from your smartphone camera (Max 25MB)
                          </div>
                        </>
                      )}
                    </label>
                  </div>

                  <SubmitRow label='Continue My Free Quote' type='button' onClick={() => setShowContact(true)} />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-6'>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <ContactField
                      label='Your Full Name'
                      type='text'
                      placeholder='e.g. Liam Murphy'
                      value={name}
                      onChange={setName}
                    />
                    <ContactField
                      label='Phone Number'
                      type='tel'
                      placeholder='+353 87 123 4567'
                      value={phone}
                      onChange={setPhone}
                    />
                    <div className='sm:col-span-2'>
                      <ContactField
                        label='Email Address'
                        type='email'
                        placeholder='name@example.ie'
                        value={email}
                        onChange={setEmail}
                      />
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => setShowContact(false)}
                    className='font-mono text-xs text-neutral-400 uppercase transition-colors hover:text-white'
                  >
                    ← Back to vehicle details
                  </button>
                  <SubmitRow label='Send My Free Quote Request' type='submit' />
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
