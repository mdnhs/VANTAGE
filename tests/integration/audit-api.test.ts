import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';
import { db } from '@/server/db';
import { auditLogs } from '@/server/db/schema';

import { call, createTestUser, signInCookie, viewAsCookie } from '../support/session';

type Row = { id: string; action: string; actorName: string | null; diff?: unknown };
type Body = {
  success: boolean;
  data: Row[] & Row & { actions: string[]; entityTypes: string[]; actors: { id: string; label: string }[] };
  pagination?: { total: number };
  error?: { code: string; message: string; causes?: Record<string, string[]> };
};
const json = async (res: Response) => (await res.json()) as Body;

const cookies = {} as Record<RoleName, string>;
const ids = {} as Record<RoleName, string>;
const emails = {} as Record<RoleName, string>;
const UUID = '00000000-0000-4000-8000-000000000000';

beforeAll(async () => {
  for (const role of ROLE_NAMES) {
    const user = await createTestUser(role);
    cookies[role] = await signInCookie(user.email);
    ids[role] = user.id;
    emails[role] = user.email;
  }
});

let firstId: string;
beforeEach(async () => {
  await db.execute(sql`truncate table audit_logs`);
  const [first] = await db
    .insert(auditLogs)
    .values([
      {
        actorId: ids.owner,
        actorEmail: emails.owner,
        action: 'service.update',
        entityType: 'service',
        entityId: 'svc-1',
        summary: 'Edited service',
        diff: { title: { from: 'a', to: 'b' } },
        ipHash: 'hash',
        userAgent: 'agent',
        createdAt: new Date('2026-06-30T23:30:00Z'),
      },
      {
        actorId: ids.admin,
        actorEmail: emails.admin,
        action: 'project.delete',
        entityType: 'project',
        entityId: 'p-1',
        summary: '=HYPERLINK("http://evil","x")',
        createdAt: new Date('2026-07-02T10:00:00Z'),
      },
      {
        action: 'enquiry.delivery_failed',
        entityType: 'quote',
        summary: 'System row',
        createdAt: new Date('2026-07-03T10:00:00Z'),
      },
    ])
    .returning({ id: auditLogs.id });
  firstId = first!.id;
});

const PATHS = () => ['/admin/audit', '/admin/audit/facets', '/admin/audit/export.csv', `/admin/audit/${firstId}`];

describe('activity log permissions', () => {
  it('rejects anonymous callers', async () => {
    for (const p of PATHS()) expect((await call(p)).status).toBe(401);
  });
  it.each(['editor', 'author', 'marketer', 'intake', 'viewer'] as const)('%s gets 403 on every route', async (role) => {
    for (const p of PATHS()) expect((await call(p, cookies[role])).status).toBe(403);
  });
  it.each(['owner', 'admin'] as const)('%s gets 200 on every route', async (role) => {
    for (const p of PATHS()) expect((await call(p, cookies[role])).status).toBe(200);
  });
});

describe('list', () => {
  it('filters by action, entityType and actor', async () => {
    const byAction = await json(await call('/admin/audit?action=project.delete', cookies.owner));
    expect(byAction.data.map((r) => r.action)).toEqual(['project.delete']);
    const byType = await json(await call('/admin/audit?entityType=service', cookies.owner));
    expect(byType.data).toHaveLength(1);
    const byActor = await json(await call(`/admin/audit?actor=${ids.admin}`, cookies.owner));
    expect(byActor.data).toHaveLength(1);
    expect(byActor.data[0].actorName).toBe('Test admin');
  });

  it('treats date filters as inclusive Irish days', async () => {
    const day = await json(await call('/admin/audit?from=2026-07-01&to=2026-07-01', cookies.owner));
    expect(day.data.map((r) => r.id)).toEqual([firstId]);
    const before = await json(await call('/admin/audit?to=2026-06-30', cookies.owner));
    expect(before.data).toHaveLength(0);
  });

  it('rejects from after to and oversized pages with 422', async () => {
    const swapped = await call('/admin/audit?from=2026-07-02&to=2026-07-01', cookies.owner);
    expect(swapped.status).toBe(422);
    expect(JSON.stringify((await json(swapped)).error)).toContain('The end date must be on or after the start date');
    expect((await call('/admin/audit?pageSize=101', cookies.owner)).status).toBe(422);
  });

  it('paginates and never leaks ipHash or userAgent', async () => {
    const res = await json(await call('/admin/audit?pageSize=2&page=2', cookies.owner));
    expect(res.pagination?.total).toBe(3);
    expect(res.data).toHaveLength(1);
    const all = JSON.stringify(await json(await call('/admin/audit', cookies.owner)));
    expect(all).not.toMatch(/ipHash|userAgent/);
    expect(all).toContain('2026-06-30T23:30:00.000Z');
  });
});

describe('detail', () => {
  it('returns the diff and no request fingerprints', async () => {
    const res = await call(`/admin/audit/${firstId}`, cookies.admin);
    const body = await json(res);
    expect(body.data.diff).toEqual({ title: { from: 'a', to: 'b' } });
    expect(JSON.stringify(body)).not.toMatch(/ipHash|userAgent/);
  });
  it('404s for an unknown id', async () => {
    const res = await call(`/admin/audit/${UUID}`, cookies.owner);
    expect(res.status).toBe(404);
    expect((await json(res)).error?.message).toBe('That activity entry no longer exists');
  });
});

describe('facets', () => {
  it('lists actions, entity types and actors', async () => {
    const { data } = await json(await call('/admin/audit/facets', cookies.owner));
    expect(data.actions).toEqual(['enquiry.delivery_failed', 'project.delete', 'service.update']);
    expect(data.entityTypes).toEqual(['project', 'quote', 'service']);
    expect(data.actors).toEqual(
      expect.arrayContaining([
        { id: ids.owner, label: `Test owner (${emails.owner})` },
        { id: ids.admin, label: `Test admin (${emails.admin})` },
      ]),
    );
  });
});

describe('export.csv', () => {
  it('returns a guarded CSV and audits the export', async () => {
    const res = await call('/admin/audit/export.csv', cookies.owner);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename="activity-\d{4}-\d{2}-\d{2}\.csv"$/);
    const lines = (await res.text()).split('\r\n');
    expect(lines[0]).toBe('"When","Who","Email","Viewing-as by","Action","Entity","Entity ID","Summary"');
    expect(lines.length).toBe(4);
    expect(lines.some((l) => l.includes(`"'=HYPERLINK(""http://evil"",""x"")"`))).toBe(true);
    expect(lines.some((l) => l.includes('"System"'))).toBe(true);

    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'audit.export'));
    expect(row?.summary).toBe('Exported 3 activity entries');
    expect(row?.actorId).toBe(ids.owner);
  });

  it('honours filters and uses the singular for one entry', async () => {
    const res = await call('/admin/audit/export.csv?action=project.delete', cookies.owner);
    expect((await res.text()).split('\r\n')).toHaveLength(2);
    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'audit.export'));
    expect(row?.summary).toBe('Exported 1 activity entry');
  });
});

describe('export edge cases', () => {
  it('flags an export capped at 10,000 rows', async () => {
    await db.insert(auditLogs).values(
      Array.from({ length: 10_001 }, (_, i) => ({
        action: 'bulk.seed',
        entityType: 'bulk',
        summary: `Row ${i}`,
      })),
    );
    const res = await call('/admin/audit/export.csv?action=bulk.seed', cookies.owner);
    const lines = (await res.text()).split('\r\n');
    expect(lines).toHaveLength(1 + 10_000 + 1);
    expect(lines.at(-1)).toContain('Export capped at 10000 entries');
    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'audit.export'));
    expect(row?.summary).toBe('Exported 10000 activity entries (capped at 10000)');
  });

  it('records the real user on a View-as export', async () => {
    const viewing = await viewAsCookie(cookies.owner, ids.admin);
    expect((await call('/admin/audit/export.csv', viewing)).status).toBe(200);
    const [row] = await db.select().from(auditLogs).where(eq(auditLogs.action, 'audit.export'));
    expect(row?.actorId).toBe(ids.admin);
    expect(row?.impersonatedBy).toBe(ids.owner);
  });

  it('neutralises tab and carriage-return leading cells', async () => {
    await db.insert(auditLogs).values([
      { action: 'x.tab', entityType: 'x', summary: '\tcmd' },
      { action: 'x.cr', entityType: 'x', summary: '\rcmd' },
    ]);
    const text = await (await call('/admin/audit/export.csv?entityType=x', cookies.owner)).text();
    expect(text).toContain('"\'\tcmd"');
    expect(text).toContain('"\'\rcmd"');
  });

  it('answers a junk actor with an empty result and a page past the end with no rows', async () => {
    const junk = await json(await call('/admin/audit?actor=not-a-user', cookies.owner));
    expect(junk.data).toHaveLength(0);
    const beyond = await json(await call('/admin/audit?page=99', cookies.owner));
    expect(beyond.data).toHaveLength(0);
    expect(beyond.pagination?.total).toBe(3);
  });

  it('rejects dates outside 1900-2100', async () => {
    expect((await call('/admin/audit?from=0050-01-01', cookies.owner)).status).toBe(422);
    expect((await call('/admin/audit?to=2101-01-01', cookies.owner)).status).toBe(422);
    expect((await call('/admin/audit/export.csv?from=1899-12-31', cookies.owner)).status).toBe(422);
  });
});
