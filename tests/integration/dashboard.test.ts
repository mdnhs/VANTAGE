import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { auditLogs, contactMessages, quoteRequests } from '@/server/db/schema';
import type { Actor } from '@/server/lib/auth/actor';
import { getDashboard, weekWindow } from '@/server/services/dashboard-service';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

const actorFor = (role: RoleName, over: Partial<Actor> = {}): Actor => ({
  userId: `u-${role}`,
  email: `${role}@example.test`,
  name: `Test ${role}`,
  roles: [role],
  twoFactorEnabled: false,
  sessionId: 's',
  impersonatedBy: null,
  ip: null,
  userAgent: null,
  ...over,
});

const NOW = new Date('2026-10-22T12:00:00Z'); // a Thursday
const PII = {
  name: 'Fiachra Oldcustomer',
  email: 'fiachra.secret@pii-mail.test',
  phone: '+353 87 555 0142',
  contactFirst: 'Roisin',
  contactLast: 'Hiddenname',
  contactEmail: 'roisin.hidden@pii-mail.test',
  contactPhone: '+353 86 555 0177',
};
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

beforeAll(async () => {
  await db.execute(sql`truncate table quote_requests, contact_messages, audit_logs cascade`);
  await db.insert(quoteRequests).values([
    { name: PII.name, email: PII.email, phone: PII.phone, status: 'new', createdAt: daysAgo(9) },
    { name: 'Recent One', email: 'r1@pii-mail.test', phone: '1', status: 'contacted', createdAt: daysAgo(1) },
    { name: 'Older One', email: 'r2@pii-mail.test', phone: '2', status: 'completed', createdAt: daysAgo(40) },
    { name: 'Spam Bot', email: 'bot@pii-mail.test', phone: '3', status: 'spam', createdAt: daysAgo(2) },
  ]);
  await db.insert(contactMessages).values({
    firstName: PII.contactFirst,
    lastName: PII.contactLast,
    email: PII.contactEmail,
    phone: PII.contactPhone,
    message: 'Hello there',
    status: 'new',
    createdAt: daysAgo(3),
  });
  await db.insert(auditLogs).values(
    Array.from({ length: 10 }, (_, i) => ({
      action: 'auth.sign_in',
      entityType: 'user',
      summary: `Signed in ${i}`,
      createdAt: daysAgo(i),
    })),
  );
});

describe('weekWindow', () => {
  it('starts the Irish week on Monday 00:00 Dublin', () => {
    const w = weekWindow(NOW);
    expect(w.days.map((d) => d.key)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
    expect(w.previousDays[0]?.key).toBe('2026-10-12');
    expect(w.start.toISOString()).toBe('2026-10-18T23:00:00.000Z');
  });
});

describe('getDashboard', () => {
  it('gives an owner the MK cards and the pipeline', async () => {
    const dto = await getDashboard(actorFor('owner'), NOW);
    expect(dto.pipeline).not.toBeNull();
    expect(Array.isArray(dto.recentActivity)).toBe(true);
    expect(dto.recentActivity).toHaveLength(8);
    // quotes (9d, 1d) + contact (3d) in the last 30 days; spam and the 40d one are out.
    expect(dto.enquiries).toEqual({ value: 3, previous: 1 });
    expect(dto.enquiriesWeek?.days).toHaveLength(7);
    expect(dto.enquiriesWeek?.current).toBe(2); // the quote from Wed 21 Oct and the contact from Mon 19 Oct
    expect(dto.seoHealth).not.toBeNull();
    expect(dto.contentHealth?.findings).not.toBeNull();
    // Oldest new enquiry is the 9-day-old quote.
    const step = dto.nextUp.find((s) => s.id === 'enquiry');
    expect(step?.title).toBe('Reply to Fiachra');
    expect(step?.description).toBe('Waiting since 13 Oct: the oldest enquiry nobody has contacted yet.');
    expect(step?.cta).toBe('Open enquiry');
    expect(step?.href).toMatch(/^\/dashboard\/quotes\/[0-9a-f-]{36}$/);
    expect(dto.nextUp.some((s) => s.id === 'invite')).toBe(true);
  });

  it('keeps every enquiry out of a marketer dashboard', async () => {
    const dto = await getDashboard(actorFor('marketer'), NOW);
    expect(dto.pipeline).toBeNull();
    expect(dto.enquiries).toBeNull();
    expect(dto.enquiriesWeek).toBeNull();
    expect(dto.recentActivity).toBeNull();
    expect(dto.seoHealth).not.toBeNull();
    const json = JSON.stringify(dto);
    for (const secret of Object.values(PII)) expect(json).not.toContain(secret);
    expect(json).not.toContain('Fiachra');
  });

  it('gives intake the pipeline but no activity or SEO', async () => {
    const dto = await getDashboard(actorFor('intake'), NOW);
    expect(dto.pipeline).not.toBeNull();
    expect(dto.recentActivity).toBeNull();
    expect(dto.seoHealth).toBeNull();
    expect(dto.contentHealth).toBeNull();
    expect(dto.enquiries).not.toBeNull();
  });

  it('does not count spam', async () => {
    const dto = await getDashboard(actorFor('owner'), NOW);
    const total = dto.enquiriesWeek!.days.reduce((t, d) => t + d.current, 0);
    // Spam bot (2 days ago, Tue 20 Oct) is not in the week.
    expect(dto.enquiriesWeek!.days.find((d) => d.key === '2026-10-20')?.current).toBe(0);
    expect(total).toBe(2);
  });

  it('gives an editor no enquiry step and no findings gated to others', async () => {
    const dto = await getDashboard(actorFor('editor'), NOW);
    expect(dto.nextUp.some((s) => s.id === 'enquiry')).toBe(false);
    expect(dto.nextUp.some((s) => s.id === 'invite')).toBe(false);
    expect(dto.pipeline).toBeNull();
    expect(dto.enquiries).toBeNull();
  });

  it('gives a viewer SEO health without fix findings', async () => {
    const dto = await getDashboard(actorFor('viewer'), NOW);
    expect(dto.seoHealth).not.toBeNull();
    expect(dto.contentHealth?.findings).toBeNull();
    expect(dto.contentHealth?.findingsTotal).toBe(0);
  });

  it('ticks the two-factor step once it is on', async () => {
    const dto = await getDashboard(actorFor('editor', { twoFactorEnabled: true }), NOW);
    const step = dto.nextUp.find((s) => s.id === 'two-factor');
    expect(step?.done).toBe(true);
    expect(step?.href).toBe('/dashboard/account');
  });
});
