import 'server-only';

import { and, count, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';

import { PAGE_KEYS, type PageKey } from '@/lib/ai/schema';
import { hasPermission, type Permissions } from '@/lib/auth/permissions';
import { GLOBAL_LABELS } from '@/lib/content/global-access';
import { db } from '@/server/db';
import { contactMessages, projects, quoteRequests, services } from '@/server/db/schema';
import type { Actor } from '@/server/lib/auth/actor';
import { analyticsService } from '@/server/services/analytics-service';
import { readEffectiveGlobal } from '@/server/services/globals-service';
import { getSeoHealth } from '@/server/queries/get-seo-health';

import { clip, flattenValue } from './flatten';
import { firstNameOf } from './prompt';
import type { AiStored } from './settings';

// Every result names what was looked at ("Looked at: About page").
export type ToolResult = { label: string } & Record<string, unknown>;

const DAY = 86_400_000;
const NO_ACCESS = "You don't have access to that, so I can't look it up.";
const SNIPPET = 200;
const MESSAGE_MAX = 500;

// Defence in depth: buildTools only offers permitted tools, and each tool still
// checks the actor itself.
const allowed = (actor: Actor, ...options: Permissions[]) => options.some((p) => hasPermission(actor.roles, p));
const refuse = (label: string): ToolResult => ({ label, error: NO_ACCESS });

const irishDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin' }).format(date);
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

export async function searchContent(actor: Actor, query: string): Promise<ToolResult> {
  const label = `Searched for “${query.slice(0, 40)}”`;
  const pagesOk = allowed(actor, { page: ['read'] });
  const contentOk = allowed(actor, { content: ['read'] });
  if (!pagesOk && !contentOk) return refuse(label);
  const needle = query.toLowerCase();
  const results: Record<string, unknown>[] = [];

  if (pagesOk) {
    const docs = await Promise.all(PAGE_KEYS.map(async (key) => ({ key, ...(await readEffectiveGlobal(key)) })));
    for (const doc of docs) {
      const text = flattenValue(doc.value);
      if (!`${GLOBAL_LABELS[doc.key]}\n${text}`.toLowerCase().includes(needle)) continue;
      const at = text.toLowerCase().indexOf(needle);
      results.push({
        kind: 'page',
        key: doc.key,
        title: GLOBAL_LABELS[doc.key],
        status: 'live',
        snippet: clip(text.slice(Math.max(0, at - 40)), SNIPPET),
      });
      if (results.length >= 10) break;
    }
  }

  if (contentOk) {
    const pattern = `%${escapeLike(query)}%`;
    const serviceRows = await db
      .select()
      .from(services)
      .where(or(ilike(services.name, pattern), ilike(services.slug, pattern), ilike(services.description, pattern)))
      .orderBy(services.displayOrder)
      .limit(10);
    for (const s of serviceRows) {
      results.push({
        kind: 'service',
        id: s.id,
        title: s.name,
        status: s.isEnabled ? 'enabled' : 'disabled',
        snippet: clip(s.description, SNIPPET),
      });
    }
    const projectRows = await db
      .select()
      .from(projects)
      .where(or(ilike(projects.title, pattern), ilike(projects.slug, pattern), ilike(projects.description, pattern)))
      .orderBy(desc(projects.updatedAt))
      .limit(10);
    for (const p of projectRows) {
      results.push({
        kind: 'project',
        id: p.id,
        title: p.title,
        status: p.status,
        snippet: clip(p.description, SNIPPET),
      });
    }
  }
  return { label, results };
}

export async function readPage(actor: Actor, key: PageKey): Promise<ToolResult> {
  if (!allowed(actor, { page: ['read'] })) return refuse('a page');
  const { value } = await readEffectiveGlobal(key);
  return { label: GLOBAL_LABELS[key], key, text: flattenValue(value) };
}

// Read-only view of the SEO center report (docs/brief.md §11). Contract unchanged:
// { label, score, issues[{ where, problem }] }.
export async function seoHealth(actor: Actor): Promise<ToolResult> {
  if (!allowed(actor, { seo: ['read'] })) return refuse('SEO health');
  const report = await getSeoHealth();
  const issues = report.issues.map((i) => ({
    where: i.kind === 'page' && i.path ? `${i.title} (${i.path})` : i.title,
    problem: i.message,
  }));
  return { label: 'SEO health', score: report.score, issues };
}

// V9-R8: counts for everyone; money only with quote.read; never recent leads.
export async function dashboardSummary(actor: Actor): Promise<ToolResult> {
  if (!allowed(actor, { dashboard: ['view'] })) return refuse('the dashboard');
  const { kpis } = await analyticsService.getOverviewData();
  const result: ToolResult = {
    label: 'the dashboard',
    totalQuoteRequests: kpis.totalInquiries,
    newQuoteRequests: kpis.totalNewEnquiries,
    activeJobs: kpis.activeJobs,
    completedJobs: kpis.completedWork,
    pendingQuotes: kpis.pendingQuotes,
    conversionRate: kpis.conversionRate,
  };
  if (allowed(actor, { quote: ['read'] })) {
    result.salesRevenue = kpis.salesRevenue;
    result.pipelineValue = kpis.pipelineValue;
  }
  return result;
}

export const ENQUIRY_RANGES = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 } as const;
export type EnquiryRange = keyof typeof ENQUIRY_RANGES;

const isoWeek = (column: Parameters<typeof sql>[1]) =>
  sql<string>`to_char(date_trunc('week', ${column} at time zone 'Europe/Dublin'), 'YYYY-MM-DD')`;

const sinceOf = (range: EnquiryRange, now: Date) => new Date(now.getTime() - ENQUIRY_RANGES[range] * DAY);

export async function quoteStats(
  actor: Actor,
  settings: AiStored,
  range: EnquiryRange,
  now = new Date(),
): Promise<ToolResult> {
  const where = gte(quoteRequests.createdAt, sinceOf(range, now));
  const week = isoWeek(quoteRequests.createdAt);
  const [byStatus, byServiceType, byWeek, bySource] = await Promise.all([
    db.select({ key: quoteRequests.status, n: count() }).from(quoteRequests).where(where).groupBy(quoteRequests.status),
    db
      .select({ key: quoteRequests.serviceType, n: count() })
      .from(quoteRequests)
      .where(where)
      .groupBy(quoteRequests.serviceType)
      .orderBy(desc(count()))
      .limit(15),
    db.select({ week, n: count() }).from(quoteRequests).where(where).groupBy(week).orderBy(week),
    db
      .select({ key: quoteRequests.source, n: count() })
      .from(quoteRequests)
      .where(where)
      .groupBy(quoteRequests.source)
      .orderBy(desc(count())),
  ]);
  const result: ToolResult = {
    label: `quote numbers (last ${ENQUIRY_RANGES[range]} days)`,
    range,
    total: byStatus.reduce((t, r) => t + r.n, 0),
    byStatus: Object.fromEntries(byStatus.map((r) => [r.key, r.n])),
    byServiceType: byServiceType.map((r) => ({ serviceType: r.key || 'unspecified', count: r.n })),
    byWeek: byWeek.map((r) => ({ weekStarting: r.week, count: r.n })),
    bySource: bySource.map((r) => ({ source: r.key || 'website', count: r.n })),
  };
  // V9-R8: details need the owner's opt-in AND quote.read.
  if (settings.shareEnquiryDetails.enabled && allowed(actor, { quote: ['read'] })) {
    const rows = await db.select().from(quoteRequests).where(where).orderBy(desc(quoteRequests.createdAt)).limit(20);
    result.recent = rows.map((r) => ({ id: r.id, ...quoteView(r) }));
  }
  return result;
}

function quoteView(r: typeof quoteRequests.$inferSelect) {
  const vehicle = [r.make, r.model, r.year].filter(Boolean).join(' ');
  return {
    firstName: firstNameOf(r.name),
    serviceType: r.serviceType || 'unspecified',
    vehicle: vehicle || null,
    status: r.status,
    createdAt: irishDate(r.createdAt),
    description: (r.description ?? '').slice(0, MESSAGE_MAX),
  };
}

export async function contactStats(
  actor: Actor,
  settings: AiStored,
  range: EnquiryRange,
  now = new Date(),
): Promise<ToolResult> {
  const where = gte(contactMessages.createdAt, sinceOf(range, now));
  const week = isoWeek(contactMessages.createdAt);
  const [byStatus, byService, byWeek, bySource] = await Promise.all([
    db
      .select({ key: contactMessages.status, n: count() })
      .from(contactMessages)
      .where(where)
      .groupBy(contactMessages.status),
    db
      .select({ key: contactMessages.service, n: count() })
      .from(contactMessages)
      .where(where)
      .groupBy(contactMessages.service)
      .orderBy(desc(count()))
      .limit(15),
    db.select({ week, n: count() }).from(contactMessages).where(where).groupBy(week).orderBy(week),
    db
      .select({ key: contactMessages.source, n: count() })
      .from(contactMessages)
      .where(where)
      .groupBy(contactMessages.source)
      .orderBy(desc(count())),
  ]);
  const result: ToolResult = {
    label: `contact message numbers (last ${ENQUIRY_RANGES[range]} days)`,
    range,
    total: byStatus.reduce((t, r) => t + r.n, 0),
    byStatus: Object.fromEntries(byStatus.map((r) => [r.key, r.n])),
    byService: byService.map((r) => ({ service: r.key || 'unspecified', count: r.n })),
    byWeek: byWeek.map((r) => ({ weekStarting: r.week, count: r.n })),
    bySource: bySource.map((r) => ({ source: r.key, count: r.n })),
  };
  if (settings.shareEnquiryDetails.enabled && allowed(actor, { contact: ['read'] })) {
    const rows = await db
      .select()
      .from(contactMessages)
      .where(where)
      .orderBy(desc(contactMessages.createdAt))
      .limit(20);
    result.recent = rows.map((r) => ({
      firstName: firstNameOf(r.firstName),
      service: r.service || 'unspecified',
      status: r.status,
      createdAt: irishDate(r.createdAt),
      message: r.message.slice(0, MESSAGE_MAX),
    }));
  }
  return result;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function quoteRequest(actor: Actor, settings: AiStored, id: string): Promise<ToolResult> {
  const label = 'a quote request';
  if (!settings.shareEnquiryDetails.enabled || !allowed(actor, { quote: ['read'] })) return refuse(label);
  if (!UUID.test(id)) return { label, found: false };
  const [row] = await db
    .select()
    .from(quoteRequests)
    .where(and(eq(quoteRequests.id, id)))
    .limit(1);
  return row ? { label, found: true, ...quoteView(row) } : { label, found: false };
}
