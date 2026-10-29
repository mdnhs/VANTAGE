import { describe, expect, it } from 'vitest';
import type { RoleName } from '@/lib/auth/permissions';
import type { Actor } from './actor';
import { assertContentWrite } from './content-access';

const actor = (roles: RoleName[], userId = 'me'): Actor => ({
  userId,
  email: 'a@b.c',
  name: 'A',
  roles,
  twoFactorEnabled: false,
  sessionId: 's',
  impersonatedBy: null,
  ip: null,
  userAgent: null,
});

const OWN = 'Authors can only add and edit their own draft projects.';
const EDITOR = 'Only an editor can publish, feature or reorder projects.';
const author = actor(['author']);
const own = { createdBy: 'me', status: 'draft' };

const refuses = (fn: () => void, message: string) =>
  expect(fn).toThrowError(expect.objectContaining({ status: 403, code: 'FORBIDDEN', message }));

describe('assertContentWrite', () => {
  it('lets an author create a project', () => {
    expect(() => assertContentWrite(author, { type: 'project', action: 'create' })).not.toThrow();
  });
  it('lets an author update and edit the gallery of their own draft', () => {
    expect(() =>
      assertContentWrite(author, { type: 'project', action: 'update', row: own, patch: { title: 'x' } }),
    ).not.toThrow();
    expect(() => assertContentWrite(author, { type: 'project', action: 'gallery', row: own })).not.toThrow();
  });
  it("refuses someone else's, legacy or published projects", () => {
    refuses(
      () => assertContentWrite(author, { type: 'project', action: 'update', row: { ...own, createdBy: 'x' } }),
      OWN,
    );
    refuses(
      () => assertContentWrite(author, { type: 'project', action: 'update', row: { ...own, createdBy: null } }),
      OWN,
    );
    refuses(
      () => assertContentWrite(author, { type: 'project', action: 'gallery', row: { ...own, status: 'published' } }),
      OWN,
    );
  });
  it('refuses status, featured and order changes, and reorder', () => {
    for (const key of ['status', 'isFeatured', 'displayOrder']) {
      refuses(
        () => assertContentWrite(author, { type: 'project', action: 'update', row: own, patch: { [key]: 1 } }),
        EDITOR,
      );
    }
    refuses(() => assertContentWrite(author, { type: 'project', action: 'reorder', row: own }), EDITOR);
  });
  it('refuses every other content type', () => {
    for (const type of ['service', 'testimonial', 'partner-logo', 'catalog', 'process-step'] as const) {
      for (const action of ['create', 'update', 'reorder'] as const) {
        refuses(() => assertContentWrite(author, { type, action }), OWN);
      }
    }
  });
  it('leaves other roles alone', () => {
    for (const roles of [['editor'], ['admin'], ['owner'], ['author', 'editor']] as RoleName[][]) {
      const a = actor(roles);
      expect(() => assertContentWrite(a, { type: 'service', action: 'reorder' })).not.toThrow();
      expect(() =>
        assertContentWrite(a, {
          type: 'project',
          action: 'update',
          row: { createdBy: null, status: 'published' },
          patch: { status: 'draft' },
        }),
      ).not.toThrow();
    }
  });
});
