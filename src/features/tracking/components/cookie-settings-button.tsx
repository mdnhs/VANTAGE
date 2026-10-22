'use client';

import { openConsentSettings } from '@/lib/tracking/consent-client';

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type='button'
      data-cookie-settings
      onClick={openConsentSettings}
      className='text-[14px] leading-[normal] text-[#a1a1a1] transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none'
    >
      {label}
    </button>
  );
}
