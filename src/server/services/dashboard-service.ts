import 'server-only';

import { and, asc, count, eq, gte, lt, ne, sql } from 'drizzle-orm';

import type { DashboardDto, NextUpItem } from '@/features/dashboard-overview/types';
import { hasPermission, type Permissions } from '@/lib/auth/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { dublinMidnight } from '@/lib/time/dublin';
import { db } from '@/server/db';
import { contactMessages, quoteRequests, users } from '@/server/db/schema';
import type { Actor } from '@/server/lib/auth/actor';
import { getSeoHealth } from '@/server/queries/get-seo-health';
import { listAudit } from '@/server/repositories/audit-repository';
import { analyticsService } from '@/server/services/analytics-service';

const DAY = 86_400_000;
const FINDINGS_SHOWN = 10;
const ACTIVITY_SHOWN = 8;
// Spam is not an enquiry (Task 9 owns the status; the literal is its value).
const SPAM = 'spam';

const DAY_KEY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin' });
const DAY_MONTH = new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', timeZone: 'Europe/Dublin' });
const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const first = (name: string) => name.trim().split(/\s+/)[0] || 'them';

const shift = (day: string, by: number) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + by)).toISOString().slice(0, 10);
};

// Dashboard weeks are Irish weeks: Monday 00:00 Europe/Dublin.
export function weekWindow(now: Date) {
  const today = DAY_KEY.format(now);
  const sinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const mondayKey = shift(today, -sinceMonday);
  const previousKey = shift(mondayKey, -7);
  const days = (from: string) => LABELS.map((label, index) => ({ key: shift(from, index), label }));
  return {
    start: dublinMidnight(mondayKey),
    end: dublinMidnight(mondayKey, 7),
    previousStart: dublinMidnight(previousKey),
    days: days(mondayKey),
    previousDays: days(previousKey),
  };
}

type Window = { from: Date; to: Date };

async function enquiryCount({ from, to }: Window, quotes: boolean, contacts: boolean) {
  const [q, c] = await Promise.all([
    quotes
      ? db
          .select({ value: count() })
          .from(quoteRequests)
          .where(
            and(ne(quoteRequests.status, SPAM), gte(quoteRequests.createdAt, from), lt(quoteRequests.createdAt, to)),
          )
      : [],
    contacts
      ? db
          .select({ value: count() })
          .from(contactMessages)
          .where(
            and(
              ne(contactMessages.status, SPAM),
              gte(contactMessages.createdAt, from),
              lt(contactMessages.createdAt, to),
            ),
          )
      : [],
  ]);
  return (q[0]?.value ?? 0) + (c[0]?.value ?? 0);
}

// Bucketed by the Irish calendar day, so the keys match weekWindow's days.
async function enquiriesByDay({ from, to }: Window, quotes: boolean, contacts: boolean) {
  const bucket = (column: typeof quoteRequests.createdAt | typeof contactMessages.createdAt) =>
    sql<string>`to_char(${column} at time zone 'Europe/Dublin', 'YYYY-MM-DD')`;
  const qDay = bucket(quoteRequests.createdAt);
  const cDay = bucket(contactMessages.createdAt);
  const [q, c] = await Promise.all([
    quotes
      ? db
          .select({ day: qDay, count: count() })
          .from(quoteRequests)
          .where(
            and(ne(quoteRequests.status, SPAM), gte(quoteRequests.createdAt, from), lt(quoteRequests.createdAt, to)),
          )
          .groupBy(qDay)
      : [],
    contacts
      ? db
          .select({ day: cDay, count: count() })
          .from(contactMessages)
          .where(
            and(
              ne(contactMessages.status, SPAM),
              gte(contactMessages.createdAt, from),
              lt(contactMessages.createdAt, to),
            ),
          )
          .groupBy(cDay)
      : [],
  ]);
  const totals = new Map<string, number>();
  for (const row of [...q, ...c]) totals.set(row.day, (totals.get(row.day) ?? 0) + row.count);
  return totals;
}

// The oldest enquiry nobody has contacted yet, across the inboxes the actor reads.
async function oldestNewEnquiry(quotes: boolean, contacts: boolean) {
  const [q, c] = await Promise.all([
    quotes
      ? db
          .select({ id: quoteRequests.id, name: quoteRequests.name, createdAt: quoteRequests.createdAt })
          .from(quoteRequests)
          .where(eq(quoteRequests.status, 'new'))
          .orderBy(asc(quoteRequests.createdAt), asc(quoteRequests.id))
          .limit(1)
      : [],
    contacts
      ? db
          .select({ id: contactMessages.id, name: contactMessages.firstName, createdAt: contactMessages.createdAt })
          .from(contactMessages)
          .where(eq(contactMessages.status, 'new'))
          .orderBy(asc(contactMessages.createdAt), asc(contactMessages.id))
          .limit(1)
      : [],
  ]);
  const candidates = [
    ...q.map((row) => ({ ...row, href: APP_ROUTES.leads.quotes.details(row.id) })),
    ...c.map((row) => ({ ...row, href: APP_ROUTES.leads.contacts.details(row.id) })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return candidates[0] ?? null;
}

async function accountCount() {
  const [row] = await db.select({ value: count() }).from(users);
  return row?.value ?? 0;
}

function twoFactorStep(actor: Actor): NextUpItem {
  return {
    id: 'two-factor',
    title: actor.twoFactorEnabled ? 'Two-factor is on' : 'Turn on two-factor authentication',
    description: 'Recommended. A code from your phone keeps your account safe even if your password leaks.',
    cta: 'Open security settings',
    href: APP_ROUTES.dashboard.account,
    done: actor.twoFactorEnabled,
  };
}

// Every block is gated here on the actor's permissions, so a role never
// receives data (or PII) it cannot read, whatever the UI hides.
export async function getDashboard(actor: Actor, now: Date = new Date()): Promise<DashboardDto> {
  const can = (p: Permissions) => hasPermission(actor.roles, p);
  const canQuotes = can({ quote: ['read'] });
  const canContacts = can({ contact: ['read'] });
  const canEnquiries = canQuotes || canContacts;
  const canSeo = can({ seo: ['read'] });
  const canFix = can({ seo: ['update'] });
  const canAudit = can({ audit: ['read'] });
  const canInvite = can({ user: ['create'] });
  const week = weekWindow(now);
  const monthAgo = new Date(now.getTime() - 30 * DAY);
  const twoMonthsAgo = new Date(now.getTime() - 60 * DAY);

  const [byDay, last30, prior30, oldest, health, audit, accounts, pipeline] = await Promise.all([
    canEnquiries
      ? enquiriesByDay({ from: week.previousStart, to: week.end }, canQuotes, canContacts)
      : Promise.resolve(null),
    canEnquiries ? enquiryCount({ from: monthAgo, to: now }, canQuotes, canContacts) : Promise.resolve(null),
    canEnquiries ? enquiryCount({ from: twoMonthsAgo, to: monthAgo }, canQuotes, canContacts) : Promise.resolve(null),
    canEnquiries ? oldestNewEnquiry(canQuotes, canContacts) : Promise.resolve(null),
    canSeo ? getSeoHealth() : Promise.resolve(null),
    canAudit ? listAudit({}, 1, ACTIVITY_SHOWN) : Promise.resolve(null),
    canInvite ? accountCount() : Promise.resolve(null),
    canQuotes ? analyticsService.getOverviewData() : Promise.resolve(null),
  ]);

  const days = byDay
    ? week.days.map((day, index) => ({
        key: day.key,
        label: day.label,
        current: byDay.get(day.key) ?? 0,
        previous: byDay.get(week.previousDays[index]!.key) ?? 0,
      }))
    : null;
  const sum = (key: 'current' | 'previous') => days?.reduce((total, day) => total + day[key], 0) ?? 0;

  const nextUp: NextUpItem[] = [];
  if (oldest) {
    nextUp.push({
      id: 'enquiry',
      title: `Reply to ${first(oldest.name)}`,
      description: `Waiting since ${DAY_MONTH.format(oldest.createdAt)}: the oldest enquiry nobody has contacted yet.`,
      cta: 'Open enquiry',
      href: oldest.href,
      done: false,
    });
  }
  nextUp.push(twoFactorStep(actor));
  if (canInvite) {
    nextUp.push({
      id: 'invite',
      title: 'Invite your team',
      description: 'Give each person their own account and only the role they need.',
      cta: 'Invite teammates',
      href: APP_ROUTES.content.users.index,
      done: (accounts ?? 0) > 1,
    });
  }

  const fixable = health ? health.issues.filter((issue) => issue.fixHref) : [];
  return {
    generatedAt: now.toISOString(),
    enquiries: last30 === null ? null : { value: last30, previous: prior30 ?? 0 },
    enquiriesWeek: days ? { days, current: sum('current'), previous: sum('previous') } : null,
    seoHealth: health ? { score: health.score, issues: health.issues.length } : null,
    contentHealth: health
      ? {
          complete: health.passed,
          needsWork: Math.max(0, health.total - health.passed),
          missing: health.alt.missing,
          findings: canFix
            ? fixable.slice(0, FINDINGS_SHOWN).map((issue) => ({
                label: issue.title,
                message: issue.message,
                href: issue.fixHref!,
              }))
            : null,
          findingsTotal: canFix ? fixable.length : 0,
        }
      : null,
    recentActivity:
      audit?.items.map((row) => ({
        id: row.id,
        actorName: row.actorName,
        actorEmail: row.actorEmail,
        action: row.action,
        summary: row.summary,
        createdAt: row.createdAt.toISOString(),
      })) ?? null,
    nextUp,
    pipeline,
  };
}
