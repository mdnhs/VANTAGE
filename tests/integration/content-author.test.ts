import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { db } from '@/server/db';
import { auditLogs, media, projects } from '@/server/db/schema';

import { call, createTestUser, sessionCookie, signInCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

let authorId = '';
let authorCookie = '';
let editorCookie = '';
let ownerCookie = '';
let before = '';
let after = '';
let n = 0;

const body = (over: Record<string, unknown> = {}) => ({
  title: 'Civic',
  slug: `civic-${(n += 1)}-${Math.random().toString(36).slice(2, 8)}`,
  vehicleModel: 'Civic',
  serviceCategory: 'Paint',
  description: 'd',
  beforeImageMediaId: before,
  afterImageMediaId: after,
  ...over,
});

const insertMedia = async () => {
  n += 1;
  const [row] = await db
    .insert(media)
    .values({
      driver: 'local',
      key: `vantage/media/2026/10/${String(n).padStart(16, '0')}-a.png`,
      url: `/uploads/a${n}.png`,
      filename: 'a.png',
      mimeType: 'image/png',
      sizeBytes: 1,
      alt: 'alt',
    })
    .returning();
  return row!.id;
};

const auditCount = async (action: string) =>
  (await db.select().from(auditLogs).where(eq(auditLogs.action, action))).length;

const create = async (cookie: string, over: Record<string, unknown> = {}) => {
  const res = await call('/projects', cookie, { method: 'POST', body: body(over) });
  return { res, data: ((await res.json()) as { data?: { id: string } }).data };
};

describe('authors own their draft projects', () => {
  beforeAll(async () => {
    await db.execute(sql`truncate table audit_logs, projects, media, users cascade`);
    const author = await createTestUser('author');
    authorId = author.id;
    authorCookie = await signInCookie(author.email);
    editorCookie = await sessionCookie('editor');
    ownerCookie = await sessionCookie('owner');
    before = await insertMedia();
    after = await insertMedia();
  });
  afterAll(async () => {
    await db.execute(sql`truncate table audit_logs, projects, media, users cascade`);
  });

  it('forces an author-created project to an unfeatured draft owned by the author', async () => {
    const { res, data } = await create(authorCookie, { status: 'published', isFeatured: true });
    expect(res.status).toBe(201);
    const [row] = await db.select().from(projects).where(eq(projects.id, data!.id));
    expect(row).toMatchObject({ status: 'draft', isFeatured: false, createdBy: authorId });
  });

  it('lets an author update their own draft, with an audit row', async () => {
    const { data } = await create(authorCookie);
    const res = await call(`/projects/${data!.id}`, authorCookie, { method: 'PATCH', body: { title: 'Renamed' } });
    expect(res.status).toBe(200);
    const [row] = await db.select().from(projects).where(eq(projects.id, data!.id));
    expect(row?.title).toBe('Renamed');
    expect(await auditCount('project.update')).toBeGreaterThan(0);
  });

  it("refuses an author editing an editor's project: 403, row unchanged, no audit row", async () => {
    const { data } = await create(editorCookie, { status: 'draft' });
    const [stored] = await db.select().from(projects).where(eq(projects.id, data!.id));
    expect(stored?.createdBy).not.toBeNull();
    const auditsBefore = await auditCount('project.update');
    const res = await call(`/projects/${data!.id}`, authorCookie, { method: 'PATCH', body: { title: 'Hijack' } });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('FORBIDDEN');
    const [row] = await db.select().from(projects).where(eq(projects.id, data!.id));
    expect(row?.title).toBe('Civic');
    expect(await auditCount('project.update')).toBe(auditsBefore);
  });

  it('refuses an author editing a project with no creator', async () => {
    const { data } = await create(ownerCookie);
    await db.update(projects).set({ createdBy: null }).where(eq(projects.id, data!.id));
    const res = await call(`/projects/${data!.id}`, authorCookie, { method: 'PATCH', body: { title: 'x' } });
    expect(res.status).toBe(403);
  });

  it('refuses an author publishing, featuring or reordering', async () => {
    const { data } = await create(authorCookie);
    const patch = (b: unknown, path = `/projects/${data!.id}`) =>
      call(path, authorCookie, { method: 'PATCH', body: b });
    expect((await patch({ status: 'published' })).status).toBe(403);
    expect((await patch({ isFeatured: true })).status).toBe(403);
    expect((await patch({ status: 'published' }, `/projects/${data!.id}/status`)).status).toBe(403);
    expect((await patch({ ids: [data!.id] }, '/projects/reorder')).status).toBe(403);
    const [row] = await db.select().from(projects).where(eq(projects.id, data!.id));
    expect(row).toMatchObject({ status: 'draft', isFeatured: false });
  });

  it('refuses an author creating other content', async () => {
    const service = await call('/services', authorCookie, {
      method: 'POST',
      body: { name: 'Dents', slug: 'dents-a', description: 'd' },
    });
    expect(service.status).toBe(403);
    const testimonial = await call('/testimonials', authorCookie, {
      method: 'POST',
      body: { name: 'A', quote: 'q', rating: 5 },
    });
    expect([403, 422]).toContain(testimonial.status);
  });

  it('leaves the editor unaffected', async () => {
    const { res, data } = await create(editorCookie, { status: 'published', isFeatured: true });
    expect(res.status).toBe(201);
    const [row] = await db.select().from(projects).where(eq(projects.id, data!.id));
    expect(row).toMatchObject({ status: 'published', isFeatured: true });
    expect((await call(`/projects/${data!.id}`, editorCookie, { method: 'PATCH', body: { title: 'E' } })).status).toBe(
      200,
    );
    expect(
      (await call(`/projects/${data!.id}/status`, editorCookie, { method: 'PATCH', body: { status: 'draft' } })).status,
    ).toBe(200);
    expect((await call('/projects/reorder', editorCookie, { method: 'PATCH', body: { ids: [data!.id] } })).status).toBe(
      200,
    );
    const service = await call('/services', editorCookie, {
      method: 'POST',
      body: { name: 'Dents', slug: 'dents-e', description: 'd' },
    });
    expect(service.status).toBe(201);
  });

  it('keeps View-as read-only for an owner viewing as the author', async () => {
    const viewing = await viewAsCookie(ownerCookie, authorId);
    const res = await call('/projects', viewing, { method: 'POST', body: body() });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('IMPERSONATION_READ_ONLY');
  });

  it('refuses when the project is published between the read and the write', async () => {
    const { projectRepository } = await import('@/server/repositories/project-repository');
    const { projectService } = await import('@/server/services/project-service');
    const { toActor } = await import('@/server/lib/auth/actor');
    const { data } = await create(authorCookie);
    const actor = toActor({
      user: { id: authorId, email: 'a@b.c', name: 'A', role: 'author' },
      session: { id: 's' },
    });
    // Flip the status right after the service's ownership read.
    const original = projectRepository.byId;
    const spy = vi.spyOn(projectRepository, 'byId').mockImplementation(async (id) => {
      const row = await original(id);
      await db.update(projects).set({ status: 'published' }).where(eq(projects.id, id));
      return row;
    });
    await expect(projectService.update(data!.id, { title: 'Late' }, actor)).rejects.toMatchObject({ status: 403 });
    spy.mockRestore();
    const [row] = await db.select().from(projects).where(eq(projects.id, data!.id));
    expect(row?.title).toBe('Civic');
  });
});
