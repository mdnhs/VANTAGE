import { StatusPill, toneForStatus } from '@/components/admin/dashboard/status-pill';
import { spamReasonLabel } from '@/lib/enquiries/spam';
import type { ContactStatus } from '../types';

const STATUS_CONFIG: Record<ContactStatus, { label: string }> = {
  new: {
    label: 'New Message',
  },
  read: {
    label: 'Read',
  },
  replied: {
    label: 'Replied',
  },
  spam: {
    label: 'Spam',
  },
  archived: {
    label: 'Archived',
  },
};

export function ContactStatusBadge({
  status,
  spamReason,
  className,
}: {
  status: string;
  spamReason?: string | null;
  className?: string;
}) {
  const config = STATUS_CONFIG[status as ContactStatus];
  let label = config?.label ?? status;
  if (status === 'spam') {
    label = spamReason ? `Spam · ${spamReasonLabel(spamReason)}` : 'Spam';
  }

  return (
    <StatusPill tone={toneForStatus(status)} className={className}>
      {label}
    </StatusPill>
  );
}
