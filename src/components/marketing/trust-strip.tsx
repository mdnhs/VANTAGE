import Image from 'next/image';

const TRUST_ITEMS = [
  { label: 'Professional Body Repair', icon: '/assets/marketing/icon-trust-body-repair.svg' },
  { label: 'Precision Colour Match', icon: '/assets/marketing/icon-trust-colour-match.svg' },
  { label: 'Insurance Support', icon: '/assets/marketing/icon-trust-insurance.svg' },
  { label: 'Quality Workmanship', icon: '/assets/marketing/icon-trust-quality.svg' },
];

export function TrustStrip() {
  return (
    <div className='relative z-10 -mt-16 px-6 sm:px-12'>
      <div className='grid grid-cols-2 divide-y divide-white/5 rounded-lg bg-[#2a2a2a]/50 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] backdrop-blur-md sm:grid-cols-4 sm:divide-x sm:divide-y-0'>
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className='flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-[#1c1b1b]/90 p-6 backdrop-blur-sm'
          >
            <Image src={item.icon} alt='' width={22} height={22} className='size-[22px]' />
            <span className='text-center text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase'>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
