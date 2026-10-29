// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActorProvider } from '@/contexts/actor-provider';
import type { MePayload } from '@/lib/auth/me';
import { permissionMap } from '@/lib/auth/permissions';
import { LegalPageTable } from './legal-page-table';
import type { LegalPage } from '../../types';

const deleteMutate = vi.fn();

vi.mock('@/features/auth/hooks/use-me', () => ({
  useMe: (actor: MePayload) => ({ data: actor }),
}));
vi.mock('../../hooks/api/query/use-legal-page-list', () => ({
  useLegalPageList: () => ({ data: undefined }),
}));
vi.mock('../../hooks/api/mutation/use-delete-legal-page', () => ({
  useDeleteLegalPage: () => ({ mutate: deleteMutate, isPending: false }),
}));
vi.mock('../../hooks/api/mutation/use-reorder-legal-pages', () => ({
  useReorderLegalPages: () => ({ mutate: vi.fn(), isPending: false }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const renderAs = (role: 'editor' | 'viewer', rows: LegalPage[]) =>
  render(
    <ActorProvider
      actor={{
        user: { id: 'u1', email: 'a@b.ie', name: 'A' },
        roles: [role],
        permissions: permissionMap([role]),
        twoFactorEnabled: false,
        impersonatedBy: null,
      }}
    >
      <LegalPageTable initialData={{ data: rows, total: rows.length }} />
    </ActorProvider>,
  );

const row = (over: Partial<LegalPage> = {}): LegalPage => ({
  id: 'p-1',
  title: 'Privacy Policy',
  slug: 'privacy-policy',
  content: { type: 'doc', content: [] },
  status: 'published',
  displayOrder: 0,
  publishedAt: new Date('2026-10-28T12:00:00Z'),
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-28T12:00:00Z'),
  ...over,
});

describe('LegalPageTable', () => {
  it('shows each page with its address and status', () => {
    renderAs('editor', [row(), row({ id: 'p-2', title: 'Terms', slug: 'terms', status: 'draft', publishedAt: null })]);
    expect(screen.getByText('/privacy-policy')).toBeTruthy();
    expect(screen.getByText('Published')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByText('28 Oct 2026')).toBeTruthy();
  });

  it('asks before deleting', () => {
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal('confirm', confirm);
    renderAs('editor', [row()]);
    const button = screen.getByLabelText('Delete Privacy Policy');
    fireEvent.click(button);
    expect(deleteMutate).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(deleteMutate).toHaveBeenCalledWith('p-1', expect.anything());
  });

  it('hides edit and delete from a read-only role', () => {
    renderAs('viewer', [row()]);
    expect(screen.queryByLabelText('Delete Privacy Policy')).toBeNull();
    expect(screen.queryByLabelText('Edit Privacy Policy')).toBeNull();
  });

  it('shows an empty state with no pages', () => {
    renderAs('editor', []);
    expect(screen.getByText('No legal pages yet')).toBeTruthy();
  });
});
