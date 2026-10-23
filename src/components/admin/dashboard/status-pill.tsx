import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-accent text-accent-foreground',
  neutral: 'bg-muted text-muted-foreground',
};

// VANTAGE quote-request and contact-message statuses (plus content statuses).
const STATUS_TONES: Record<string, StatusTone> = {
  new: 'info',
  approved: 'info',
  in_progress: 'info',
  contacted: 'warning',
  waiting_response: 'warning',
  quote_sent: 'warning',
  completed: 'success',
  replied: 'success',
  published: 'success',
  cancelled: 'neutral',
  archived: 'neutral',
  draft: 'neutral',
  hidden: 'neutral',
  enabled: 'success',
  featured: 'warning',
  signed_in: 'success',
  invited: 'info',
  spam: 'danger',
};

export const toneForStatus = (status: string): StatusTone =>
  STATUS_TONES[
    status
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
  ] ?? 'neutral';

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-semibold whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
