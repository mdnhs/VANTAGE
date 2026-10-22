'use client';

import { useState } from 'react';

import { relativeTime } from '@/components/admin/dashboard/format';
import { StatusPill, type StatusTone } from '@/components/admin/dashboard/status-pill';
import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';

import type { ChannelStatus, TrackingAdmin } from '../types';

export const STATUS_LABELS: Record<ChannelStatus, string> = {
  off: 'Off',
  ready: 'Ready',
  'missing-id': 'Add the ID',
  'needs-gtm': 'Needs GTM',
  'needs-banner': 'Turn on the consent banner',
  'needs-pixel': 'Needs the Pixel ID',
  'no-token': 'Add the access token',
  'no-key': 'Server key missing (APP_ENCRYPTION_KEY)',
  'unreadable-token': "Token can't be read; enter it again",
};

const TONES: Record<ChannelStatus, StatusTone> = {
  off: 'neutral',
  ready: 'success',
  'missing-id': 'warning',
  'needs-gtm': 'warning',
  'needs-banner': 'warning',
  'needs-pixel': 'warning',
  'no-token': 'warning',
  'no-key': 'danger',
  'unreadable-token': 'danger',
};

const CHANNELS = [
  ['gtm', 'Google Tag Manager'],
  ['ga4', 'GA4'],
  ['meta', 'Meta Pixel'],
  ['capi', 'Conversions API'],
] as const;

const IRISH_TIME = new Intl.DateTimeFormat('en-IE', {
  timeZone: 'Europe/Dublin',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function TrackingStatus({ doc }: { doc: Pick<TrackingAdmin, 'status' | 'lastCapiFailure'> }) {
  // Fixed per mount, so the line does not change under a re-render.
  const [now] = useState(() => Date.now());
  const failure = doc.lastCapiFailure;
  return (
    <DashboardCard title='Status'>
      <ul className='flex flex-col divide-y'>
        {CHANNELS.map(([key, name]) => (
          <li key={key} className='flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0'>
            <span className='font-medium'>{name}</span>
            <StatusPill tone={TONES[doc.status[key]]}>{STATUS_LABELS[doc.status[key]]}</StatusPill>
          </li>
        ))}
      </ul>
      {failure ? (
        <p className='text-sm text-muted-foreground'>
          Last Conversions API failure: {failure.summary} ({IRISH_TIME.format(new Date(failure.at))} Irish time,{' '}
          {relativeTime(failure.at, now)})
        </p>
      ) : null}
    </DashboardCard>
  );
}
