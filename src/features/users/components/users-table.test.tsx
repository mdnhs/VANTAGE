// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActorProvider } from '@/contexts/actor-provider';
import type { MePayload } from '@/lib/auth/me';
import { permissionMap } from '@/lib/auth/permissions';
import { UsersTable } from './users-table';
import type { UserDto } from '../types';

vi.mock('@/features/auth/hooks/use-me', () => ({
  useMe: (actor: MePayload) => ({ data: actor }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithActor = (ui: React.ReactNode, actor: Partial<MePayload> = {}) => {
  const fullActor: MePayload = {
    user: { id: 'u1', email: 'admin@test.com', name: 'Admin' },
    roles: ['admin'],
    permissions: permissionMap(['admin']),
    twoFactorEnabled: false,
    impersonatedBy: null,
    ...actor,
  };
  return render(<ActorProvider actor={fullActor}>{ui}</ActorProvider>);
};

const mockUser: UserDto = {
  id: 'u2',
  email: 'colleague@example.com',
  name: 'Colleague',
  roles: ['editor'],
  banned: false,
  banReason: null,
  banExpires: null,
  twoFactorEnabled: true,
  invitePending: false,
  lastActiveAt: '2026-10-22T10:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('UsersTable', () => {
  it('active user status renders StatusPill with "Active" and success tone', () => {
    const { container } = renderWithActor(<UsersTable users={[mockUser]} onAction={vi.fn()} />);

    const pill = container.querySelector('[data-tone]');
    expect(pill).not.toBeNull();
    expect(pill?.getAttribute('data-tone')).toBe('success');
    expect(pill?.textContent).toBe('Active');
  });

  it('empty users list renders EmptyState with title "No people found"', () => {
    renderWithActor(<UsersTable users={[]} onAction={vi.fn()} />);

    expect(screen.getByText('No people found')).toBeDefined();
  });
});
