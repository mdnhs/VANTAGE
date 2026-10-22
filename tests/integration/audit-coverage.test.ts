import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, contactMessages, media, quoteRequests } from '@/server/db/schema';
import * as auditModule from '@/server/lib/audit';
import { sql } from 'drizzle-orm';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

let ownerId: string;
let owner: string;

const rows = (action: string) => db.select().from(auditLogs).where(eq(auditLogs.action, action));
const body = async (res: Response) => (await res.json()) as { data: { id: string } & Record<string, unknown> };

const seedQuote = async () => {
  const [row] = await db
    .insert(quoteRequests)
    .values({
      name: 'Pat Murphy',
      email: 'pat@example.com',
      phone: '0871234567',
      description: 'SECRET-DESCRIPTION',
      adminNotes: 'OLD-NOTE',
    })
    .returning();
  return row!;
};

const PROJECT = {
  title: 'Audit project',
  slug: 'audit-project',
  vehicleModel: 'BMW 3',
  serviceCategory: 'Respray',
  description: 'Done',
  status: 'draft',
};
const TESTIMONIAL = { customerName: 'Old Name', reviewText: 'OLD-REVIEW-TEXT', rating: 5 };
const SERVICE = { name: 'Dent repair', slug: 'dent-repair', description: 'Fixes dents' };

beforeEach(async () => {
  vi.restoreAllMocks();
  await db.execute(sql`truncate table audit_logs, quote_requests, contact_messages, services cascade`);
  const u = await createTestUser('owner');
  ownerId = u.id;
  owner = await signInCookie(u.email);
});

describe('quote and contact mutations', () => {
  it('records a quote edit as an allowlisted diff with notes redacted', async () => {
    const q = await seedQuote();
    const res = await call(`/quotes/${q.id}`, owner, {
      method: 'PATCH',
      body: { status: 'contacted', adminNotes: 'NOTE-TEXT' },
    });
    expect(res.status).toBe(200);
    const found = await rows('quote.update');
    expect(found).toHaveLength(1);
    const row = found[0]!;
    expect(row).toMatchObject({ entityType: 'quote', entityId: q.id, actorId: ownerId });
    expect(row.diff).toMatchObject({
      status: { from: 'new', to: 'contacted' },
      adminNotes: { from: '[not recorded]', to: '[not recorded]' },
    });
    const dump = JSON.stringify(row);
    for (const leak of ['NOTE-TEXT', 'OLD-NOTE', 'SECRET-DESCRIPTION', 'pat@example.com', '0871234567']) {
      expect(dump).not.toContain(leak);
    }
  });

  it('writes nothing for a no-op edit', async () => {
    const q = await seedQuote();
    const res = await call(`/quotes/${q.id}`, owner, { method: 'PATCH', body: { status: 'new' } });
    expect(res.status).toBe(200);
    expect(await rows('quote.update')).toHaveLength(0);
  });

  it('writes nothing for a 404 or a 422', async () => {
    const missing = await call('/quotes/00000000-0000-4000-8000-000000000000', owner, {
      method: 'PATCH',
      body: { status: 'contacted' },
    });
    expect(missing.status).toBe(404);
    const q = await seedQuote();
    const invalid = await call(`/quotes/${q.id}`, owner, { method: 'PATCH', body: { status: 'nonsense' } });
    expect(invalid.status).toBe(422);
    const badId = await call('/quotes/not-a-uuid', owner, { method: 'PATCH', body: { status: 'contacted' } });
    expect(badId.status).toBe(422);
    expect(await rows('quote.update')).toHaveLength(0);
  });

  it('records a staff-entered quote as a create without a diff', async () => {
    const res = await call('/quotes/admin', owner, {
      method: 'POST',
      body: { name: 'Walk In', email: 'w@example.com', phone: '0871234567' },
    });
    expect(res.status).toBe(201);
    const created = await body(res);
    const found = await rows('quote.create');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ entityType: 'quote', entityId: created.data.id, diff: null });
  });

  it('does not audit the public submissions', async () => {
    const res = await call('/quotes', undefined, {
      method: 'POST',
      body: { name: 'Pat', email: 'pat@example.com', phone: '0871234567' },
    });
    expect(res.status).toBe(201);
    expect(await rows('quote.create')).toHaveLength(0);
  });

  it('records a contact delete with its id', async () => {
    const [c] = await db
      .insert(contactMessages)
      .values({ firstName: 'Ann', lastName: 'B', email: 'a@example.com', phone: '0871234567', message: 'hi' })
      .returning();
    const res = await call(`/contacts/${c!.id}`, owner, { method: 'DELETE' });
    expect(res.status).toBe(200);
    const found = await rows('contact.delete');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ entityType: 'contact', entityId: c!.id });
  });
});

describe('website content mutations', () => {
  it('records a service edit with its changed field, and a reorder without a diff', async () => {
    const createRes = await call('/services', owner, { method: 'POST', body: SERVICE });
    expect(createRes.status).toBe(201);
    const created = await body(createRes);
    expect(await rows('service.create')).toHaveLength(1);

    const res = await call(`/services/${created.data.id}`, owner, { method: 'PATCH', body: { name: 'Dent fix' } });
    expect(res.status).toBe(200);
    const upd = await rows('service.update');
    expect(upd).toHaveLength(1);
    expect(upd[0]!.diff).toEqual({ name: { from: 'Dent repair', to: 'Dent fix' } });

    const reorder = await call('/services/reorder', owner, { method: 'PATCH', body: { ids: [created.data.id] } });
    expect(reorder.status).toBe(200);
    const re = await rows('service.reorder');
    expect(re).toHaveLength(1);
    expect(re[0]).toMatchObject({ entityId: null, diff: null });

    await call(`/services/${created.data.id}`, owner, { method: 'DELETE' });
    expect(await rows('service.delete')).toHaveLength(1);
  });
});

describe('diff hygiene', () => {
  it('records that identity fields changed without their values', async () => {
    const q = await seedQuote();
    const res = await call(`/quotes/${q.id}`, owner, {
      method: 'PATCH',
      body: { address: '12 SECRET-STREET', city: 'SECRET-CITY' },
    });
    expect(res.status).toBe(200);
    const [row] = await rows('quote.update');
    expect(row!.diff).toMatchObject({
      address: { from: '[not recorded]', to: '[not recorded]' },
      city: { from: '[not recorded]', to: '[not recorded]' },
    });
    expect(JSON.stringify(row)).not.toContain('SECRET');
  });

  it('project status changes record only the status', async () => {
    const [before, after] = await db
      .insert(media)
      .values(
        ['audit-before', 'audit-after'].map((name, i) => ({
          driver: 'local' as const,
          key: `vantage/media/2026/10/${String(i + 1).padStart(16, '0')}-${name}.png`,
          url: `/uploads/${name}.png`,
          filename: `${name}.png`,
          mimeType: 'image/png',
          sizeBytes: 1,
        })),
      )
      .returning();
    const created = await call('/projects', owner, {
      method: 'POST',
      body: { ...PROJECT, beforeImageMediaId: before!.id, afterImageMediaId: after!.id },
    });
    expect(created.status).toBe(201);
    const { data } = await body(created);
    const res = await call(`/projects/${data.id}/status`, owner, { method: 'PATCH', body: { status: 'published' } });
    expect(res.status).toBe(200);
    const [row] = await rows('project.update');
    expect(Object.keys(row!.diff as object)).toEqual(['status']);
    expect(JSON.stringify(row)).not.toContain('galleryImages');
  });

  it('testimonial edits never record the review or the customer name', async () => {
    const created = await call('/testimonials', owner, { method: 'POST', body: TESTIMONIAL });
    expect(created.status).toBe(201);
    const { data } = await body(created);
    const res = await call(`/testimonials/${data.id}`, owner, {
      method: 'PATCH',
      body: { reviewText: 'NEW-REVIEW-SECRET', customerName: 'NEW-NAME-SECRET' },
    });
    expect(res.status).toBe(200);
    const [row] = await rows('testimonial.update');
    expect(row!.diff).toMatchObject({
      reviewText: { from: '[not recorded]' },
      customerName: { from: '[not recorded]' },
    });
    const dump = JSON.stringify(row);
    expect(dump).not.toContain('SECRET');
    expect(dump).not.toContain(TESTIMONIAL.reviewText);
  });
});

describe('failure and attribution', () => {
  it('a throwing audit never fails the mutation', async () => {
    vi.spyOn(auditModule, 'audit').mockRejectedValue(new Error('boom'));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const q = await seedQuote();
    const res = await call(`/quotes/${q.id}`, owner, { method: 'PATCH', body: { status: 'contacted' } });
    expect(res.status).toBe(200);
    expect(err).toHaveBeenCalledWith('[audit-route] failed', 'quote.update');
  });

  it('refuses writes during View-as and records nothing', async () => {
    const intake = await createTestUser('intake');
    const q = await seedQuote();
    const viewing = await viewAsCookie(owner, intake.id);
    const res = await call(`/quotes/${q.id}`, viewing, { method: 'PATCH', body: { status: 'contacted' } });
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('IMPERSONATION_READ_ONLY');
    expect(await rows('quote.update')).toHaveLength(0);
    const [after] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, q.id));
    expect(after!.status).toBe('new');
  });
});
