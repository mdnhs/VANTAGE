'use client';

import { imageFileToDataUrl } from '@/lib/image-to-data-url';
import { useState, type CSSProperties } from 'react';

import { submitQuoteRequest } from '@/features/quote-requests/services/api';
import { track } from '@/lib/tracking/track';

// Figma-exported icon glyphs (node 131:204)
const ICONS = {
  dot: '/assets/landing/1606e632d7f1d3ed093428897b21854cb1b7b173.svg',
  check: '/assets/landing/af900d3d05a78ce1eaa2cfe4e4134d654de6e007.svg',
  shield: '/assets/landing/c8658e6226cec27e466cc2e667edfe110cf9e0d5.svg',
  star: '/assets/landing/8eb2725bb6ffb8bbe6d5d8c53e0004091ca272f4.svg',
  search: '/assets/landing/c571a6526ded6c330b8ec0618146969fe6285598.svg',
  zap: '/assets/landing/fd10f2e7d9775f83bb5963cf33996d15acaf6164.svg',
  collision: '/assets/landing/bf4553ed0c3464738a94a4a4ba471c653bdfaadd.svg',
  pdr: '/assets/landing/07a3af75c4de4f4d9d4ae2161333d299b1ff7fdf.svg',
  respray: '/assets/landing/d317c590ada170a3c35b69563a4c3e188248bdae.svg',
  wheel: '/assets/landing/884e00ae4f0a3d95e6bb39d2b26751fa8b32ed00.svg',
  upload: '/assets/landing/d67c13a6cce7df3d3e67ee755b356d94c1f1ca8e.svg',
  quote: '/assets/landing/77f4614fe4f24a8e612134c222c8e6b222b0af4f.svg',
  arrow: '/assets/landing/59b4140a9e8daa1d2222ade20afa6a0530e51e09.svg',
};

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

// `darkGlyph` = Figma svg stroke is black (inverted when on dark chip), else white (inverted when selected).
const CATEGORIES = [
  { id: 'collision', label: 'Collision', icon: ICONS.collision, inset: '8.33%', bleed: '-3.75%', darkGlyph: true },
  { id: 'pdr', label: 'Dent / PDR', icon: ICONS.pdr, inset: '12.5% 8.33%', bleed: '-4.17% -3.75%', darkGlyph: false },
  {
    id: 'respray',
    label: 'Respray',
    icon: ICONS.respray,
    inset: '9.38% 17.19% 8.33% 16.67%',
    bleed: '-3.8% -4.72%',
    darkGlyph: false,
  },
  {
    id: 'wheel',
    label: 'Alloy wheel',
    icon: ICONS.wheel,
    inset: '8.33% 12.5% 8.33% 16.67%',
    bleed: '-3.75% -4.41%',
    darkGlyph: false,
  },
];

const STEPS = [
  { label: 'Vehicle & Reg', short: 'Vehicle' },
  { label: 'Damage Type', short: 'Damage' },
  { label: 'Photos & Contact', short: 'Contact' },
];

const BENEFITS = [
  { title: 'No-obligation & 100% free', body: 'Clear breakdown of parts, labour and paint costs.' },
  { title: 'Direct insurance support', body: 'We work directly with your insurer so you are not out of pocket.' },
  { title: 'Replacement car provision', body: 'Keep moving while your vehicle is in our Dublin workshop.' },
];

const FIELD_LABEL = 'block text-[11px] leading-normal tracking-[0.66px] text-[#a1a1a1] uppercase';

function ZapIcon() {
  return <FigmaIcon src={ICONS.zap} size={14} inset='12.5% 22.92%' bleed='-7.14% -9.89%' />;
}

function SubmitRow({
  label,
  type,
  onClick,
  disabled,
}: {
  label: string;
  type: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className='flex w-full flex-col gap-[28px]'>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className='group flex w-full items-center justify-center gap-[10px] rounded-[8px] bg-[#dc2626] py-[16px] pr-[22px] pl-[24px] drop-shadow-[0px_8px_14px_rgba(220,38,38,0.35)] transition-colors hover:bg-[#b91c1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60'
      >
        <FigmaIcon src={ICONS.quote} size={18} inset='8.33%' bleed='-3.75%' />
        <span className='text-[13px] leading-normal font-semibold tracking-[1.04px] whitespace-nowrap text-white uppercase'>
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
          Average response time: 48 minutes
        </span>
        <span className='text-[#737373]'>No card required</span>
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
    <label className='flex flex-col gap-[10px]'>
      <span className={FIELD_LABEL}>{label} *</span>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full rounded-[12px] border border-[#323232] bg-[#111113] px-[18px] py-[14px] text-[14px] text-white transition-colors placeholder:text-[#737373] focus:border-[#dc2626] focus:outline-none'
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
  const [photos, setPhotos] = useState<File[]>([]);
  const photoCount = photos.length;
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const converted = await Promise.all(photos.map(imageFileToDataUrl));
      const photoUrls = converted.filter((url): url is string => Boolean(url));

      const eventId = crypto.randomUUID();
      await submitQuoteRequest({
        name,
        phone,
        email,
        registration: regNumber || null,
        description: vehicleFound ? `Vehicle detected: ${vehicleFound}` : null,
        serviceType: selectedCategory,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
        source: 'homepage_estimator',
        eventId,
        sourcePath: window.location.pathname,
      });
      track({
        event: 'generate_lead',
        params: { lead_source: 'quote_form', form_id: 'estimator' },
        eventId,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit quote. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id='estimator' className='relative w-full bg-[#111113] px-4 py-16 sm:px-6 sm:py-24 lg:px-10 xl:py-[120px]'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-12 lg:flex-row lg:items-center lg:gap-[80px]'>
        {/* Left column: copy */}
        <div className='flex w-full flex-col items-start gap-[28px] lg:w-[480px] lg:shrink-0'>
          <div className='flex items-center gap-[10px] rounded-full border border-[#252525] bg-[#16161a] py-[7px] pr-[16px] pl-[14px]'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt='' src={ICONS.dot} width={6} height={6} className='block shrink-0' />
            <span className='text-[11px] leading-normal tracking-[0.44px] whitespace-nowrap text-[#d4d4d4] uppercase'>
              2-Minute Online Quotation
            </span>
          </div>

          <h2 className='w-full font-[family-name:var(--font-manrope)] text-[34px] leading-[40px] font-extrabold tracking-[-0.68px] text-white uppercase sm:text-[48px] sm:leading-[54px] sm:tracking-[-0.96px]'>
            Show us the damage. We&apos;ll <span className='text-[#dc2626]'>provide the cost.</span>
          </h2>

          <p className='w-full text-[16px] leading-[26px] text-[#a1a1a1]'>
            No need to take time off work or drive in with damage. Upload three photos and our Dublin estimators will
            issue an itemised, insurer-compatible quote with estimated completion dates.
          </p>

          <ul className='flex w-full flex-col gap-[20px] pt-[8px]'>
            {BENEFITS.map((b) => (
              <li key={b.title} className='flex w-full items-start gap-[16px]'>
                <span className='flex shrink-0 items-center justify-center rounded-full bg-[#055e45] p-[6px]'>
                  <FigmaIcon src={ICONS.check} size={16} inset='27.08% 20.83%' bleed='-10.23% -8.04%' />
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
            <p className='min-w-0 flex-1 text-[13px] leading-[20px] text-[#a1a1a1]'>
              Privacy guarantee: your registration and contact details are used only for your quote.
            </p>
          </div>
        </div>

        {/* Right column: interactive 3-step quote form */}
        <div className='w-full min-w-0 lg:flex-1'>
          <div className='flex w-full flex-col gap-[28px] rounded-[20px] border border-[#232328] bg-[#161616] p-5 sm:p-[36px]'>
            {/* Stepper */}
            <ol className='flex w-full items-center gap-2 sm:gap-[14px]'>
              {STEPS.map((step, idx) => {
                const n = idx + 1;
                const isActive = activeStep === n;
                const isReached = activeStep >= n;
                return (
                  <li key={step.label} className='contents'>
                    {idx > 0 && <span aria-hidden className='h-px min-w-2 flex-1 bg-[#323232]' />}
                    <span className='flex shrink-0 items-center gap-[6px] sm:gap-[10px]'>
                      <span
                        className={`flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] leading-normal font-medium ${
                          isReached ? 'bg-[#dc2626] text-white' : 'border border-[#404040] text-[#a1a1a1]'
                        }`}
                      >
                        {n}
                      </span>
                      <span
                        className={`text-[10px] leading-normal tracking-[0.44px] whitespace-nowrap uppercase sm:text-[11px] ${
                          isActive ? 'text-white' : 'text-[#737373]'
                        }`}
                        aria-current={isActive ? 'step' : undefined}
                      >
                        <span className='sm:hidden'>{step.short}</span>
                        <span className='hidden sm:inline'>{step.label}</span>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {submitted ? (
              <div className='flex flex-col items-center justify-center py-10 text-center'>
                <span className='mb-4 flex items-center justify-center rounded-full bg-[#055e45] p-[12px]'>
                  <FigmaIcon src={ICONS.check} size={28} inset='27.08% 20.83%' bleed='-10.23% -8.04%' />
                </span>
                <h3 className='font-[family-name:var(--font-manrope)] text-[24px] leading-[30px] font-extrabold tracking-[-0.48px] text-white uppercase'>
                  Estimate request logged
                </h3>
                <p className='mt-2 max-w-md text-[14px] leading-[22px] text-[#a1a1a1]'>
                  Our Dublin estimating team will review your vehicle details ({regNumber}) and dispatch your itemised
                  quote within 2 business hours.
                </p>
                <button
                  type='button'
                  onClick={() => {
                    setSubmitted(false);
                    setShowContact(false);
                  }}
                  className='mt-6 rounded-[8px] border border-[#323232] px-5 py-2.5 text-[11px] tracking-[0.66px] text-[#d4d4d4] uppercase transition-colors hover:border-[#454545] hover:bg-[#232328] hover:text-white'
                >
                  ← New estimate
                </button>
              </div>
            ) : !showContact ? (
              <>
                {/* Registration field */}
                <div className='flex w-full flex-col gap-[10px]'>
                  <label htmlFor='estimator-reg' className={FIELD_LABEL}>
                    Irish Registration Number
                  </label>
                  <div className='flex w-full items-center overflow-clip rounded-[12px] border border-[#323232] bg-[#111113] pr-[10px] transition-colors focus-within:border-[#dc2626]'>
                    <div className='flex shrink-0 flex-col items-center justify-center gap-[2px] self-stretch bg-[#2a2a2a] px-[14px] py-[12px] select-none'>
                      <span className='flex items-start gap-[2px]'>
                        <FigmaIcon src={ICONS.star} size={9} inset='8.33%' bleed='-5.83% -5.85% -5.85% -5.84%' />
                        <FigmaIcon src={ICONS.star} size={9} inset='8.33%' bleed='-5.83% -5.85% -5.85% -5.84%' />
                      </span>
                      <span className='text-[12px] leading-normal font-medium text-white'>IRL</span>
                    </div>
                    <input
                      id='estimator-reg'
                      type='text'
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      placeholder='e.g. 241-D-12345'
                      className='w-full min-w-0 flex-1 bg-transparent px-3 py-[16px] font-[family-name:var(--font-manrope)] text-[18px] leading-normal font-bold tracking-[0.66px] text-white uppercase placeholder:text-[#737373] focus:outline-none sm:px-[18px] sm:text-[22px]'
                    />
                    <button
                      type='button'
                      onClick={handleLookup}
                      aria-label={isLookingUp ? 'Searching registration' : 'Look up registration'}
                      className={`flex shrink-0 items-center justify-center rounded-[10px] bg-[#232328] p-[11px] transition-colors hover:bg-[#323232] focus-visible:outline-2 focus-visible:outline-[#dc2626] ${
                        isLookingUp ? 'animate-pulse' : ''
                      }`}
                    >
                      <FigmaIcon src={ICONS.search} size={24} inset='12.5%' bleed='-4.17%' />
                    </button>
                  </div>
                  {vehicleFound ? (
                    <p className='flex items-center gap-[6px] text-[12px] leading-normal text-[#00d491]'>
                      <ZapIcon />
                      Identified: {vehicleFound}
                    </p>
                  ) : (
                    <p className='flex items-center gap-[6px] text-[12px] leading-normal text-[#737373]'>
                      <ZapIcon />
                      Auto-fills year, make, model &amp; OEM paint code
                    </p>
                  )}
                </div>

                {/* Category field */}
                <div className='flex w-full flex-col gap-[10px]'>
                  <span className={FIELD_LABEL}>Primary Repair Category</span>
                  <div className='grid w-full grid-cols-2 gap-[10px] sm:grid-cols-4' role='radiogroup'>
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      const invert = cat.darkGlyph ? !isSelected : isSelected;
                      return (
                        <button
                          key={cat.id}
                          type='button'
                          role='radio'
                          aria-checked={isSelected}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex min-w-0 flex-col items-center justify-center gap-[10px] rounded-[12px] border px-[12px] py-[16px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626] ${
                            isSelected
                              ? 'border-white bg-white text-black'
                              : 'border-[#323232] bg-[#111113] text-white hover:border-[#454545] hover:bg-[#16161a]'
                          }`}
                        >
                          <FigmaIcon
                            src={cat.icon}
                            size={24}
                            inset={cat.inset}
                            bleed={cat.bleed}
                            className={invert ? 'invert' : ''}
                          />
                          <span className='text-[13px] leading-normal font-medium whitespace-nowrap'>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload field */}
                <div className='flex w-full flex-col gap-[10px]'>
                  <span className={FIELD_LABEL}>Upload Damage Photos (Up to 4 Angles)</span>
                  <label className='group flex w-full cursor-pointer flex-col items-center justify-center gap-[8px] rounded-[12px] border border-dashed border-[#454545] px-[20px] py-[28px] text-center transition-colors focus-within:border-[#dc2626] hover:border-[#dc2626]/70 hover:bg-[#1a1a1d]'>
                    <input
                      type='file'
                      accept='image/jpeg,image/png,image/heic'
                      multiple
                      className='sr-only'
                      onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 4))}
                    />
                    <span className='flex items-center justify-center rounded-[12px] bg-[#242424] p-[12px] transition-colors group-hover:bg-[#2e2e2e]'>
                      <FigmaIcon src={ICONS.upload} size={22} inset='12.5%' bleed='-4.55%' />
                    </span>
                    {photoCount > 0 ? (
                      <span className='text-[14px] leading-normal font-medium text-[#00d491]'>
                        ✓ {photoCount} photo{photoCount > 1 ? 's' : ''} attached
                      </span>
                    ) : (
                      <span className='text-[14px] leading-normal font-medium text-white'>
                        Tap to upload photos or drag &amp; drop here
                      </span>
                    )}
                    <span className='text-[10px] leading-normal tracking-[0.4px] text-[#737373] uppercase'>
                      JPEG, PNG or HEIC · Max 25MB
                    </span>
                  </label>
                </div>

                <SubmitRow label='Continue my free quote' type='button' onClick={() => setShowContact(true)} />
              </>
            ) : (
              <form onSubmit={handleSubmit} className='flex w-full flex-col gap-[28px]'>
                <div className='grid grid-cols-1 gap-[20px] sm:grid-cols-2'>
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
                  className='self-start text-[11px] leading-normal tracking-[0.66px] text-[#a1a1a1] uppercase transition-colors hover:text-white'
                >
                  ← Back to vehicle details
                </button>
                {errorMsg && <p className='text-[12px] text-[#dc2626]'>{errorMsg}</p>}
                <SubmitRow
                  label={isSubmitting ? 'Sending request…' : 'Send my free quote request'}
                  type='submit'
                  disabled={isSubmitting}
                />
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
