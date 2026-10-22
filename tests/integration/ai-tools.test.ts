import { sql } from 'drizzle-orm';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { type RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { contactMessages, projects, quoteRequests, services } from '@/server/db/schema';
import type { Actor } from '@/server/lib/auth/actor';
import { settingsRepository } from '@/server/repositories/settings-repository';
import { TOOL_FAILED, ToolFailure } from '@/server/services/ai/errors';
import { contextSubject } from '@/server/services/ai/context';
import { parseAiSettings } from '@/server/services/ai/settings';
import { buildTools } from '@/server/services/ai/tools';
import {
  contactStats,
  dashboardSummary,
  quoteRequest,
  quoteStats,
  readPage,
  searchContent,
  seoHealth,
} from '@/server/services/ai/tool-data';

const actorFor = (role: RoleName): Actor => ({
  userId: `u-${role}`,
  email: `${role}@example.test`,
  name: `Test ${role}`,
  roles: [role],
  twoFactorEnabled: false,
  sessionId: 's',
  impersonatedBy: null,
  ip: null,
  userAgent: null,
});

const off = parseAiSettings({});
const on = parseAiSettings({ shareEnquiryDetails: { enabled: true } });

const PII = {
  email: 'jane.secret@pii-mail.test',
  phone: '+353 87 555 0199',
  lastName: 'Fitzgeraldson',
  registration: '191-D-12345',
  eircode: 'D02 XY99',
  address: '12 Hidden Lane',
  description: 'Rear bumper smashed in a car park, needs a respray.',
  notes: 'Internal note: customer was rude',
};
let quoteId: string;

beforeAll(async () => {
  await db.execute(
    sql`truncate table quote_requests, contact_messages, services, projects, settings, audit_logs cascade`,
  );
  const rows = await db
    .insert(quoteRequests)
    .values([
      {
        name: `Jane ${PII.lastName}`,
        email: PII.email,
        phone: PII.phone,
        address: PII.address,
        city: 'Dublin',
        eircode: PII.eircode,
        registration: PII.registration,
        make: 'Ford',
        model: 'Focus',
        year: 2019,
        serviceType: 'Dent repair',
        description: PII.description + ' ' + 'x'.repeat(600),
        adminNotes: PII.notes,
        status: 'completed',
        estimatedCost: '1200.00',
      },
      {
        name: 'Tom Byrne',
        email: 'tom.byrne@pii-mail.test',
        phone: '+353 86 555 0100',
        serviceType: 'Respray',
        status: 'new',
        estimatedCost: '300.00',
      },
    ])
    .returning({ id: quoteRequests.id });
  quoteId = rows[0]!.id;
  await db.insert(contactMessages).values({
    firstName: 'Mary',
    lastName: 'Oconnorson',
    email: 'mary.oconnor@pii-mail.test',
    phone: '+353 85 555 0123',
    service: 'Insurance claim',
    message: 'Can you handle my insurance claim?',
  });
  await db
    .insert(services)
    .values({ name: 'Paint Protection', slug: 'paint-protection', description: 'Ceramic coating.' });
  await db.insert(projects).values({
    title: 'Mustang restoration',
    slug: 'mustang-restoration',
    vehicleModel: 'Mustang',
    serviceCategory: 'Restoration',
    description: 'Full respray and panel work.',
    status: 'published',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const toolNames = (role: RoleName, settings = off) =>
  Object.keys(buildTools({ actor: actorFor(role), settings })).sort();

describe('tool offering', () => {
  it('offers only the tools a role may use', () => {
    const all = ['getContactStats', 'getDashboardSummary', 'getPage', 'getQuoteStats', 'getSeoHealth', 'searchContent'];
    expect(toolNames('owner')).toEqual(all);
    expect(toolNames('admin')).toEqual(all);
    expect(toolNames('marketer')).toEqual(all);
    expect(toolNames('intake')).toEqual(['getContactStats', 'getDashboardSummary', 'getQuoteStats']);
    expect(toolNames('author')).toEqual([
      'getContactStats',
      'getDashboardSummary',
      'getPage',
      'getQuoteStats',
      'searchContent',
    ]);
    expect(toolNames('owner', on)).toContain('getQuoteRequest');
    expect(toolNames('intake', on)).toContain('getQuoteRequest');
    expect(toolNames('marketer', on)).not.toContain('getQuoteRequest');
  });
});

describe('enquiry data', () => {
  it('redacts enquiry fields', async () => {
    const owner = actorFor('owner');
    const hidden = JSON.stringify([
      await quoteStats(owner, off, '30d'),
      await contactStats(owner, off, '30d'),
      await dashboardSummary(owner),
    ]);
    for (const secret of [
      PII.email,
      PII.phone,
      PII.lastName,
      PII.registration,
      PII.eircode,
      PII.address,
      'Rear bumper',
      'Oconnorson',
      'mary.oconnor',
      'Can you handle',
    ]) {
      expect(hidden).not.toContain(secret);
    }
    expect(await quoteStats(owner, off, '30d')).not.toHaveProperty('recent');
    expect(await contactStats(owner, off, '30d')).not.toHaveProperty('recent');

    const shared = await quoteStats(owner, on, '30d');
    const recent = shared.recent as Record<string, unknown>[];
    expect(recent).toHaveLength(2);
    const jane = recent.find((r) => r.firstName === 'Jane')!;
    expect(Object.keys(jane).sort()).toEqual([
      'createdAt',
      'description',
      'firstName',
      'id',
      'serviceType',
      'status',
      'vehicle',
    ]);
    expect((jane.description as string).length).toBeLessThanOrEqual(500);
    // The id makes getQuoteRequest reachable from the stats list.
    expect(await quoteRequest(owner, on, jane.id as string)).toMatchObject({ found: true, firstName: 'Jane' });
    expect(jane.vehicle).toBe('Ford Focus 2019');
    const sharedJson = JSON.stringify([shared, await contactStats(owner, on, '30d')]);
    for (const secret of [
      PII.email,
      PII.phone,
      PII.lastName,
      PII.registration,
      PII.eircode,
      PII.address,
      PII.notes,
      'Oconnorson',
    ]) {
      expect(sharedJson).not.toContain(secret);
    }
    const contactRecent = (await contactStats(owner, on, '30d')).recent as Record<string, unknown>[];
    expect(Object.keys(contactRecent[0]!).sort()).toEqual(['createdAt', 'firstName', 'message', 'service', 'status']);
  });

  it('shows details only with the opt-in and the read permission', async () => {
    expect(await quoteStats(actorFor('marketer'), on, '30d')).not.toHaveProperty('recent');
    expect(await quoteStats(actorFor('intake'), on, '30d')).toHaveProperty('recent');
    expect(await quoteRequest(actorFor('owner'), off, quoteId)).toHaveProperty('error');
    expect(await quoteRequest(actorFor('marketer'), on, quoteId)).toHaveProperty('error');
    const found = await quoteRequest(actorFor('owner'), on, quoteId);
    expect(found).toMatchObject({ found: true, firstName: 'Jane', vehicle: 'Ford Focus 2019' });
    expect(JSON.stringify(found)).not.toMatch(/pii-mail|555|Fitzgeraldson|191-D|XY99|Hidden Lane|rude/);
    expect(await quoteRequest(actorFor('owner'), on, 'not-a-uuid')).toEqual({ label: 'a quote request', found: false });
    expect(await quoteRequest(actorFor('owner'), on, '00000000-0000-4000-8000-000000000000')).toEqual({
      label: 'a quote request',
      found: false,
    });
  });

  it('counts by status, service type and week', async () => {
    const stats = await quoteStats(actorFor('owner'), off, '30d');
    expect(stats).toMatchObject({ total: 2, byStatus: { completed: 1, new: 1 } });
    expect(stats.byServiceType).toEqual(expect.arrayContaining([{ serviceType: 'Dent repair', count: 1 }]));
    expect((stats.byWeek as unknown[]).length).toBeGreaterThan(0);
  });

  it('money only with quote.read', async () => {
    const marketer = await dashboardSummary(actorFor('marketer'));
    expect(marketer).not.toHaveProperty('salesRevenue');
    expect(marketer).not.toHaveProperty('pipelineValue');
    expect(marketer).not.toHaveProperty('recentLeads');
    const owner = await dashboardSummary(actorFor('owner'));
    expect(owner).toMatchObject({ salesRevenue: 1200, pipelineValue: 1500 });
    expect(owner).not.toHaveProperty('recentLeads');
  });
});

describe('content tools', () => {
  it('readPage returns the page copy as text', async () => {
    const page = await readPage(actorFor('editor'), 'page.about');
    expect(page.label).toBe('About page');
    expect(page.text as string).toContain('Our Heritage');
    expect((page.text as string).length).toBeLessThanOrEqual(8000);
    expect(await readPage(actorFor('intake'), 'page.about')).toHaveProperty('error');
  });

  it('searches pages, services and projects within permissions', async () => {
    const hits = (await searchContent(actorFor('editor'), 'paint')).results as { kind: string; title: string }[];
    expect(hits.map((h) => h.kind)).toEqual(expect.arrayContaining(['service']));
    const pages = (await searchContent(actorFor('editor'), 'heritage')).results as { kind: string; key?: string }[];
    expect(pages).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'page', key: 'page.about' })]));
    const projectHits = (await searchContent(actorFor('editor'), 'mustang')).results as { kind: string }[];
    expect(projectHits[0]!.kind).toBe('project');
    expect((await searchContent(actorFor('marketer'), 'x'.repeat(60))).label).toBe(`Searched for “${'x'.repeat(40)}”`);
    expect(await searchContent(actorFor('intake'), 'paint')).toHaveProperty('error');
  });

  it('reports SEO health from the seo global', async () => {
    const health = await seoHealth(actorFor('marketer'));
    expect(health.label).toBe('SEO health');
    expect(health.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(health.issues)).toBe(true);
    expect(await seoHealth(actorFor('intake'))).toHaveProperty('error');
  });

  it('contextSubject is null without page.read', async () => {
    const context = { path: '/dashboard/about', entity: { type: 'page' as const, key: 'page.about' as const } };
    expect(await contextSubject(actorFor('intake'), context)).toBeNull();
    expect(await contextSubject(actorFor('editor'), context)).toEqual({
      kind: 'page',
      key: 'page.about',
      title: 'About page',
    });
    expect(await contextSubject(actorFor('editor'), { path: '/dashboard' })).toBeNull();
  });
});

describe('tool failures', () => {
  it('a failing lookup surfaces as ToolFailure without the error text', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(settingsRepository, 'get').mockRejectedValue(new Error('select secret-table-details failed'));
    const tools = buildTools({ actor: actorFor('owner'), settings: off });
    const execute = tools.getPage!.execute as unknown as (input: unknown, options: unknown) => Promise<unknown>;
    const run = execute({ key: 'page.about' }, { toolCallId: 't1', messages: [], context: {} });
    await expect(run).rejects.toBeInstanceOf(ToolFailure);
    await expect(run).rejects.toThrow(TOOL_FAILED);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('secret-table-details');
  });
});
