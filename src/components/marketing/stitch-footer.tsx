import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail, Car } from 'lucide-react';

const SERVICES = [
  { label: 'Accident & Crash Repair', href: '#services' },
  { label: 'Paintless Dent Removal (PDR)', href: '#services' },
  { label: 'Bare-Metal Respraying', href: '#services' },
  { label: 'Celette Chassis Realignment', href: '#services' },
  { label: 'Diamond Cut Alloy Refurbishment', href: '#services' },
  { label: 'ADAS Sensor Calibration', href: '#services' },
];

export function StitchFooter() {
  return (
    <footer className='border-t border-white/10 bg-[#080808] pt-20 pb-12 text-neutral-400'>
      <div className='mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Column 1: Brand & Bio */}
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-3'>
              <div className='relative size-9 overflow-hidden rounded border border-white/10'>
                <Image
                  src='/assets/marketing/stitch-logo.png'
                  alt='Vantage Autobody'
                  fill
                  className='object-contain p-0.5'
                />
              </div>
              <span className='font-[family-name:var(--font-manrope)] text-xl font-bold tracking-wider text-white uppercase'>
                VANTAGE
              </span>
            </div>
            <p className='text-xs leading-relaxed text-neutral-400'>
              Ireland&apos;s premier automotive crash repair, precision chassis reconstruction, and high-end vehicle
              restoration center. Operating to OEM specifications since 1998.
            </p>
            <div className='pt-2 font-mono text-[11px] text-neutral-500'>CRO Reg No: 489214 • VAT No: IE 9482710W</div>
          </div>

          {/* Column 2: Workshop Services */}
          <div className='flex flex-col gap-3'>
            <h4 className='font-mono text-xs font-semibold tracking-widest text-white uppercase'>
              Specialist Services
            </h4>
            <nav className='flex flex-col gap-2 text-xs'>
              {SERVICES.map((s) => (
                <a key={s.label} href={s.href} className='transition-colors hover:text-[#dc2626]'>
                  {s.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Column 3: Insurance & Workshop Hours */}
          <div className='flex flex-col gap-3'>
            <h4 className='font-mono text-xs font-semibold tracking-widest text-white uppercase'>Opening Hours</h4>
            <div className='space-y-1.5 text-xs'>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>Monday – Thursday:</span>
                <span className='text-white'>08:00 – 18:00</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>Friday:</span>
                <span className='text-white'>08:00 – 17:30</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>Saturday:</span>
                <span className='text-white'>09:00 – 13:00 (Estimates)</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>Sunday:</span>
                <span className='text-neutral-500'>Closed</span>
              </div>
            </div>

            <div className='mt-3 rounded border border-white/5 bg-white/[0.03] p-3 text-[11px] text-neutral-400'>
              <span className='mb-0.5 block font-semibold text-white'>Insurance Right to Choose:</span>
              Under Irish Law, you have the legal right to choose your preferred repairer regardless of insurer
              steering.
            </div>
          </div>

          {/* Column 4: Contact & Dublin Location */}
          <div className='flex flex-col gap-3'>
            <h4 className='font-mono text-xs font-semibold tracking-widest text-white uppercase'>Dublin Facility</h4>
            <div className='flex flex-col gap-3 text-xs'>
              <div className='flex items-start gap-2.5'>
                <MapPin className='mt-0.5 size-4 shrink-0 text-[#dc2626]' />
                <span className='text-neutral-300'>
                  Unit 4, Industrial Estate,
                  <br />
                  Dublin Road, Dublin, Ireland
                </span>
              </div>
              <div className='flex items-center gap-2.5'>
                <Phone className='size-4 shrink-0 text-[#dc2626]' />
                <a href='tel:+35312345678' className='text-white transition-colors hover:text-[#dc2626]'>
                  +353 1 234 5678
                </a>
              </div>
              <div className='flex items-center gap-2.5'>
                <Mail className='size-4 shrink-0 text-[#dc2626]' />
                <a
                  href='mailto:info@vantageautobody.ie'
                  className='text-neutral-300 transition-colors hover:text-white'
                >
                  info@vantageautobody.ie
                </a>
              </div>
              <div className='flex items-center gap-2.5'>
                <Car className='size-4 shrink-0 text-emerald-400' />
                <span className='text-neutral-400'>Courtesy car drop-off available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className='flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 font-mono text-xs text-neutral-500 md:flex-row'>
          <span>© 2026 Vantage Autobody Ireland Ltd. All rights reserved.</span>
          <div className='flex flex-wrap gap-6'>
            <Link href='#privacy' className='transition-colors hover:text-white'>
              Privacy Policy
            </Link>
            <Link href='#terms' className='transition-colors hover:text-white'>
              Terms of Repair
            </Link>
            <Link href='#warranty' className='transition-colors hover:text-white'>
              Warranty Disclaimers
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
