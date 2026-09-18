'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Search,
  Check,
  Car,
  Sparkles,
  Paintbrush,
  Disc,
  UploadCloud,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'collision', label: 'Collision', icon: Car },
  { id: 'pdr', label: 'Dent / PDR', icon: Sparkles },
  { id: 'respray', label: 'Respray', icon: Paintbrush },
  { id: 'wheel', label: 'Alloy Wheel', icon: Disc },
];

export function StitchEstimator() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [regNumber, setRegNumber] = useState('231-D-48912');
  const [vehicleFound, setVehicleFound] = useState<string | null>(
    '2023 BMW M4 Competition Coupe • Portimao Blue (C31)',
  );
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('collision');
  const [photoUploaded, setPhotoUploaded] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id='estimator' className='relative w-full overflow-hidden border-y border-white/10 bg-[#111111] py-24'>
      {/* Background glow */}
      <div className='pointer-events-none absolute top-1/2 right-0 size-96 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl' />

      <div className='mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-12'>
          {/* Left Column */}
          <div className='flex flex-col gap-6 lg:col-span-5'>
            <span className='flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-[#dc2626] uppercase'>
              <span className='h-px w-6 bg-[#dc2626]' />
              2-Minute Online Quotation
            </span>
            <h2 className='font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight text-white uppercase sm:text-4xl lg:text-[36px] lg:leading-[44px]'>
              Show Us The Damage. <br />
              <span className='text-[#dc2626]'>We&apos;ll Provide The Cost.</span>
            </h2>
            <p className='text-sm leading-relaxed text-neutral-300'>
              No need to take time off work or drive in with damage. Enter your registration and damage details, and our
              Dublin estimators will issue an itemized, insurer-compatible quote with guaranteed completion dates.
            </p>

            <div className='space-y-4 pt-2'>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-emerald-400' />
                <div>
                  <div className='text-sm font-semibold text-white'>No-Obligation &amp; 100% Free</div>
                  <div className='text-xs text-neutral-400'>Clear breakdown of parts, labor, and paint costs.</div>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-emerald-400' />
                <div>
                  <div className='text-sm font-semibold text-white'>Direct Insurance Support</div>
                  <div className='text-xs text-neutral-400'>
                    We work directly with your insurer so you don&apos;t pay out-of-pocket.
                  </div>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-emerald-400' />
                <div>
                  <div className='text-sm font-semibold text-white'>Replacement Car Provision</div>
                  <div className='text-xs text-neutral-400'>
                    Keep moving while your vehicle is in our Dublin workshop.
                  </div>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4'>
              <Lock className='size-6 shrink-0 text-[#dc2626]' />
              <div className='text-xs text-neutral-300'>
                <strong className='text-white'>Privacy Guarantee:</strong> Your registration and contact details are
                strictly used for your vehicle quote calculation.
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3-Step Card */}
          <div className='lg:col-span-7'>
            <div className='relative rounded-xl border border-white/15 bg-[#181818] p-6 shadow-2xl sm:p-8'>
              {/* Steps Bar */}
              <div className='mb-6 flex items-center justify-between border-b border-white/10 pb-6'>
                <button type='button' onClick={() => setCurrentStep(1)} className='flex items-center gap-2 text-left'>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      currentStep >= 1 ? 'bg-[#dc2626] text-white' : 'bg-white/10 text-neutral-300'
                    }`}
                  >
                    1
                  </span>
                  <span
                    className={`text-xs tracking-wider uppercase ${
                      currentStep === 1 ? 'font-bold text-white' : 'text-neutral-400'
                    }`}
                  >
                    Vehicle &amp; Reg
                  </span>
                </button>

                <div className='hidden h-px w-8 bg-white/20 sm:block' />

                <button type='button' onClick={() => setCurrentStep(2)} className='flex items-center gap-2 text-left'>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      currentStep >= 2 ? 'bg-[#dc2626] text-white' : 'bg-white/10 text-neutral-300'
                    }`}
                  >
                    2
                  </span>
                  <span
                    className={`text-xs tracking-wider uppercase ${
                      currentStep === 2 ? 'font-bold text-white' : 'text-neutral-400'
                    }`}
                  >
                    Damage Type
                  </span>
                </button>

                <div className='hidden h-px w-8 bg-white/20 sm:block' />

                <button type='button' onClick={() => setCurrentStep(3)} className='flex items-center gap-2 text-left'>
                  <span
                    className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      currentStep === 3 ? 'bg-[#dc2626] text-white' : 'bg-white/10 text-neutral-300'
                    }`}
                  >
                    3
                  </span>
                  <span
                    className={`text-xs tracking-wider uppercase ${
                      currentStep === 3 ? 'font-bold text-white' : 'text-neutral-400'
                    }`}
                  >
                    Photos &amp; Contact
                  </span>
                </button>
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
                    Reference: <span className='font-mono font-bold text-[#dc2626]'>VAN-2026-89412</span>
                    <br />
                    Our Dublin estimating team will review your vehicle details ({regNumber}) and dispatch your itemized
                    quote within 2 business hours.
                  </p>
                  <button
                    type='button'
                    onClick={() => {
                      setSubmitted(false);
                      setCurrentStep(1);
                    }}
                    className='mt-6 flex items-center gap-2 rounded border border-white/20 px-5 py-2.5 font-mono text-xs text-neutral-300 uppercase transition-colors hover:bg-white/10 hover:text-white'
                  >
                    <RotateCcw className='size-3.5' /> New Estimate
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-6'>
                  {/* Step 1: Vehicle & Reg */}
                  {currentStep === 1 && (
                    <div className='space-y-5'>
                      <div>
                        <label className='mb-2 block font-mono text-xs tracking-wider text-neutral-300 uppercase'>
                          Irish Registration Number
                        </label>
                        <div className='flex items-center overflow-hidden rounded-md border border-white/20 bg-black shadow-inner transition-all focus-within:border-[#dc2626]'>
                          {/* Euro / IRL flag plate end */}
                          <div className='flex flex-col items-center justify-center border-r border-white/10 bg-[#003399] px-3.5 py-3 text-white select-none'>
                            <span className='text-[10px] leading-none tracking-tight text-amber-300'>★ ★</span>
                            <span className='mt-0.5 font-mono text-[11px] font-bold tracking-widest'>IRL</span>
                          </div>
                          <input
                            type='text'
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                            placeholder='e.g. 241-D-12345'
                            className='w-full bg-transparent px-4 py-3 font-mono text-lg font-bold tracking-widest text-white uppercase placeholder:text-neutral-600 focus:outline-none'
                          />
                          <button
                            type='button'
                            onClick={handleLookup}
                            className='flex items-center gap-1.5 border-l border-white/10 bg-white/10 px-4 py-3 font-mono text-xs text-neutral-300 uppercase transition-colors hover:bg-white/20'
                          >
                            <Search className='size-3.5' />
                            {isLookingUp ? 'Searching...' : 'Lookup'}
                          </button>
                        </div>

                        {vehicleFound && (
                          <div className='mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400'>
                            <Check className='size-3.5 shrink-0' />
                            <span>Identified: {vehicleFound}</span>
                          </div>
                        )}
                        <p className='mt-1 text-[11px] text-neutral-500'>
                          Auto-fills Year, Make, Model &amp; OEM Paint Code from the Irish vehicle database.
                        </p>
                      </div>

                      <div className='flex justify-end pt-2'>
                        <button
                          type='button'
                          onClick={() => setCurrentStep(2)}
                          className='flex items-center gap-2 rounded bg-[#dc2626] px-6 py-3 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-red-700'
                        >
                          Continue to Damage Type <ArrowRight className='size-4' />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Damage Type */}
                  {currentStep === 2 && (
                    <div className='space-y-5'>
                      <div>
                        <label className='mb-2.5 block font-mono text-xs tracking-wider text-neutral-300 uppercase'>
                          Primary Repair Category
                        </label>
                        <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
                          {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = selectedCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type='button'
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`cursor-pointer rounded border p-3.5 text-center transition-all ${
                                  isSelected
                                    ? 'border-[#dc2626] bg-[#dc2626]/20 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]'
                                    : 'border-white/15 bg-white/[0.03] text-neutral-400 hover:border-white/40 hover:text-white'
                                }`}
                              >
                                <Icon className='mx-auto mb-1.5 size-5' />
                                <span className='block text-[11px] font-semibold tracking-wider uppercase'>
                                  {cat.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className='mb-2 block font-mono text-xs tracking-wider text-neutral-300 uppercase'>
                          Approximate Area of Damage
                        </label>
                        <input
                          type='text'
                          placeholder='e.g. Passenger door, front bumper scratch, rear wing crease'
                          defaultValue='Front Bumper and bonnet stone chips'
                          className='w-full rounded border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#dc2626] focus:outline-none'
                        />
                      </div>

                      <div className='flex justify-between pt-2'>
                        <button
                          type='button'
                          onClick={() => setCurrentStep(1)}
                          className='rounded border border-white/20 px-5 py-2.5 font-mono text-xs text-neutral-300 uppercase hover:bg-white/5'
                        >
                          Back
                        </button>
                        <button
                          type='button'
                          onClick={() => setCurrentStep(3)}
                          className='flex items-center gap-2 rounded bg-[#dc2626] px-6 py-3 text-xs font-bold tracking-wider text-white uppercase transition-colors hover:bg-red-700'
                        >
                          Continue to Photos &amp; Contact <ArrowRight className='size-4' />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Photos & Contact */}
                  {currentStep === 3 && (
                    <div className='space-y-5'>
                      {/* Photo Upload Box */}
                      <div>
                        <label className='mb-2 block font-mono text-xs tracking-wider text-neutral-300 uppercase'>
                          Upload Damage Photos (Optional but recommended)
                        </label>
                        <div
                          onClick={() => setPhotoUploaded(!photoUploaded)}
                          className='flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/[0.02] p-6 text-center transition-all hover:border-[#dc2626]/60 hover:bg-white/[0.04]'
                        >
                          <UploadCloud className='mb-2 size-8 text-[#dc2626]' />
                          {photoUploaded ? (
                            <span className='font-mono text-xs text-emerald-400'>
                              ✓ 2 photos attached (front-angle.jpg, bumper-scratch.jpg)
                            </span>
                          ) : (
                            <>
                              <span className='text-xs font-semibold text-white'>
                                Click or drag 1-3 photos of the damage
                              </span>
                              <span className='mt-1 text-[11px] text-neutral-500'>
                                Clear photos help us guarantee accurate itemized parts &amp; labor caps.
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Contact Fields */}
                      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <div>
                          <label className='mb-1.5 block font-mono text-[11px] tracking-wider text-neutral-300 uppercase'>
                            Your Full Name *
                          </label>
                          <input
                            type='text'
                            required
                            placeholder='e.g. Liam Murphy'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className='w-full rounded border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#dc2626] focus:outline-none'
                          />
                        </div>
                        <div>
                          <label className='mb-1.5 block font-mono text-[11px] tracking-wider text-neutral-300 uppercase'>
                            Phone Number *
                          </label>
                          <input
                            type='tel'
                            required
                            placeholder='+353 87 123 4567'
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className='w-full rounded border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#dc2626] focus:outline-none'
                          />
                        </div>
                        <div className='sm:col-span-2'>
                          <label className='mb-1.5 block font-mono text-[11px] tracking-wider text-neutral-300 uppercase'>
                            Email Address *
                          </label>
                          <input
                            type='email'
                            required
                            placeholder='name@example.ie'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='w-full rounded border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#dc2626] focus:outline-none'
                          />
                        </div>
                      </div>

                      <div className='flex items-center justify-between pt-2'>
                        <button
                          type='button'
                          onClick={() => setCurrentStep(2)}
                          className='rounded border border-white/20 px-5 py-2.5 font-mono text-xs text-neutral-300 uppercase hover:bg-white/5'
                        >
                          Back
                        </button>
                        <button
                          type='submit'
                          className='flex items-center gap-2 rounded bg-[#dc2626] px-8 py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-red-900/40 transition-colors hover:bg-red-700'
                        >
                          <span>Get Guaranteed Free Quote</span>
                          <ArrowRight className='size-4' />
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
