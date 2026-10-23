'use client';

import { useEffect, useState } from 'react';

import { API_ROUTES } from '@/lib/routes/api-routes';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;
const RETRY_MS = [1_000, 3_000, 8_000];
// The server accepts a stamp for 7 days; renew a little before that.
const RENEW_AFTER_MS = 6 * 86_400_000;

const issuedAt = (stamp: string) => Number(stamp.split('.')[0]);

async function fetchStamp(): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}${API_ROUTES.enquiryStamp}`, { cache: 'no-store' });
    const body = (await (res.ok ? res.json() : null)) as { data?: { stamp?: string } } | null;
    return typeof body?.data?.stamp === 'string' ? body.data.stamp : '';
  } catch {
    return '';
  }
}

// A signed timestamp for the public forms, fetched after mount so the pages stay static.
// A failed fetch is retried (1 s, 3 s, 8 s), then again when the tab becomes visible or the
// network returns. Never fetched at submit time. '' when none could be fetched; the server
// accepts an unstamped enquiry rather than lose a lead.
export function useEnquiryStamp(): string {
  const [stamp, setStamp] = useState('');
  useEffect(() => {
    let live = true;
    let current = '';
    let busy = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const load = async () => {
      if (busy) return;
      busy = true;
      const next = await fetchStamp();
      busy = false;
      if (live && next) {
        current = next;
        setStamp(next);
      }
      return next;
    };
    const run = async (attempt: number) => {
      if (!live || current) return;
      if (!(await load()) && attempt < RETRY_MS.length) {
        timers.push(setTimeout(() => void run(attempt + 1), RETRY_MS[attempt]));
      }
    };
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      if (!current || Date.now() - issuedAt(current) > RENEW_AFTER_MS) void load();
    };
    void run(0);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);
    return () => {
      live = false;
      timers.forEach(clearTimeout);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', refresh);
    };
  }, []);
  return stamp;
}
