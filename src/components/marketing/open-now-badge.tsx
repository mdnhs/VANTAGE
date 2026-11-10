'use client';

import { useEffect, useState } from 'react';

import { isOpenAt, type WeeklyGroup } from '@/lib/content/hours-card';

// The workshop's wall clock; the weekly opening times are set in this zone.
const SITE_TIME_ZONE = 'Europe/Dublin';

// Open / closed right now. Worked out in the browser so the page itself stays cacheable; it shows
// nothing until then, so server and browser markup never disagree.
export function OpenNowBadge({
  weekly,
  openLabel,
  closedLabel,
}: {
  weekly: WeeklyGroup[];
  openLabel: string;
  closedLabel: string;
}) {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOpen(isOpenAt(weekly, new Date(), SITE_TIME_ZONE));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [weekly]);

  if (open === null) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-[5px] font-site-body text-[11px] leading-normal font-semibold tracking-[0.66px] uppercase ${
        open ? 'border-[#00d492]/40 bg-[#00d492]/[0.14] text-[#00d492]' : 'border-[#3e4551] bg-[#2e343e] text-[#a4abb6]'
      }`}
    >
      <span aria-hidden='true' className={`size-1.5 rounded-full ${open ? 'bg-[#00d492]' : 'bg-[#7d8591]'}`} />
      {open ? openLabel : closedLabel}
    </span>
  );
}
