'use client';

import { useEffect, useState } from 'react';

import { API_ROUTES } from '@/lib/routes/api-routes';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

// A signed timestamp for the public forms, fetched after mount so the pages stay static.
// '' when it can't be fetched; the server then decides what an unstamped form means.
export function useEnquiryStamp(): string {
  const [stamp, setStamp] = useState('');
  useEffect(() => {
    let live = true;
    fetch(`${BASE_URL}${API_ROUTES.enquiryStamp}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data?: { stamp?: string } } | null) => {
        if (live && typeof body?.data?.stamp === 'string') setStamp(body.data.stamp);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return stamp;
}
