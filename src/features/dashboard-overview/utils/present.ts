import { formatDelta, formatNumber, type Delta } from '@/components/admin/dashboard/format';
import { toneForStatus, type StatusTone } from '@/components/admin/dashboard/status-pill';
import type { Permissions } from '@/lib/auth/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { DashboardDto } from '../types';

const HOUR = new Intl.DateTimeFormat('en-IE', {
  hour: 'numeric',
  hourCycle: 'h23',
  timeZone: 'Europe/Dublin',
});

// "Good morning, {name}", by the clock in Ireland.
export function greetingFor(date: Date) {
  const hour = Number(HOUR.format(date));
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';

// The time of day comes from the dashboard answer (the server's clock when it
// built the numbers on screen), falling back to when the page was rendered.
export function dashboardGreeting(name: string, generatedAt: string | undefined, renderedAt: string) {
  return `${greetingFor(new Date(generatedAt ?? renderedAt))}, ${name}`;
}

const ACTION_LABELS: Record<string, string> = {
  'auth.sign_in': 'Signed in',
  'auth.impersonate': 'Viewed as',
  'user.invite': 'Invited',
  'user.bootstrap-owner': 'Created',
  'page.publish': 'Published',
  'user.role': 'Role changed',
  'lead.update': 'Updated',
};

export function actionStatus(action: string): { label: string; tone: StatusTone } | undefined {
  const label = ACTION_LABELS[action];
  return label ? { label, tone: toneForStatus(label) } : undefined;
}

export type KpiProps = {
  label: string;
  value: string;
  caption: string;
  delta: Delta | null;
  href?: string;
  variant?: 'hero' | 'default';
};

const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`;

// KPI row. A card appears only when the dashboard carries its data, and links
// only when the viewer can open the page behind them.
export function kpisFor(data: DashboardDto, can: (p: Permissions) => boolean): KpiProps[] {
  const kpis: KpiProps[] = [];
  if (data.enquiries) {
    // No baseline (a quiet previous period) means no comparison to caption.
    const delta = data.enquiries.previous > 0 ? formatDelta(data.enquiries.value, data.enquiries.previous) : null;
    const href = can({ quote: ['read'] })
      ? APP_ROUTES.leads.quotes.index
      : can({ contact: ['read'] })
        ? APP_ROUTES.leads.contacts.index
        : undefined;
    kpis.push({
      label: 'New enquiries',
      value: formatNumber(data.enquiries.value),
      delta,
      caption: delta ? 'vs the 30 days before' : 'last 30 days',
      variant: 'hero',
      ...(href ? { href } : {}),
    });
  }
  if (data.seoHealth) {
    kpis.push({
      label: 'SEO health',
      value: `${data.seoHealth.score}%`,
      delta: null,
      caption: data.seoHealth.issues ? `${plural(data.seoHealth.issues, 'issue', 'issues')} to fix` : 'nothing to fix',
      ...(can({ seo: ['read'] }) ? { href: '/dashboard/seo' } : {}),
    });
  }
  return kpis;
}

const SETUP = new Set(['two-factor', 'invite']);
export const setupSteps = (items: DashboardDto['nextUp']) => items.filter((item) => SETUP.has(item.id));
