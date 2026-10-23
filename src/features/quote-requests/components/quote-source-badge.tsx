'use client';

import { Phone, MessageCircle, UserCheck, Mail, Share2, Globe } from 'lucide-react';
import { StatusPill } from '@/components/admin/dashboard/status-pill';

export const SOURCE_CONFIG: Record<string, { label: string; icon: typeof Phone; className: string }> = {
  phone_call: {
    label: 'Phone Call',
    icon: Phone,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
  },
  walk_in: {
    label: 'Walk-in',
    icon: UserCheck,
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/25 dark:text-indigo-400',
  },
  email: {
    label: 'Email',
    icon: Mail,
    className: 'bg-sky-500/10 text-sky-600 border-sky-500/25 dark:text-sky-400',
  },
  social_media: {
    label: 'Social / FB',
    icon: Share2,
    className: 'bg-pink-500/10 text-pink-600 border-pink-500/25 dark:text-pink-400',
  },
  website: {
    label: 'Website Form',
    icon: Globe,
    className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/25 dark:text-zinc-400',
  },
  quote_page: {
    label: 'Quote Page',
    icon: Globe,
    className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/25 dark:text-zinc-400',
  },
  homepage_estimator: {
    label: 'Home Estimator',
    icon: Globe,
    className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/25 dark:text-zinc-400',
  },
  contact_modal: {
    label: 'Contact Modal',
    icon: Globe,
    className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/25 dark:text-zinc-400',
  },
};

export function QuoteSourceBadge({
  source,
  className,
  _showIcon = true,
}: {
  source: string | null | undefined;
  className?: string;
  _showIcon?: boolean;
}) {
  const key = source || 'website';
  const config = SOURCE_CONFIG[key];
  const rawLabel = config?.label ?? key.replace(/_/g, ' ');
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  return (
    <StatusPill tone='neutral' className={className}>
      {label}
    </StatusPill>
  );
}
