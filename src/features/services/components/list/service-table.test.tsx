// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActorProvider } from '@/contexts/actor-provider';
import type { MePayload } from '@/lib/auth/me';
import { permissionMap } from '@/lib/auth/permissions';
import { ServiceTable } from './service-table';
import type { Service } from '../../types';

vi.mock('@/features/auth/hooks/use-me', () => ({
  useMe: (actor: MePayload) => ({ data: actor }),
}));

vi.mock('../../hooks/api/query/use-service-list', () => ({
  useServiceList: () => ({ data: undefined }),
}));

vi.mock('../../hooks/api/mutation/use-update-service', () => ({
  useUpdateService: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../hooks/api/mutation/use-delete-service', () => ({
  useDeleteService: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../hooks/api/mutation/use-reorder-services', () => ({
  useReorderServices: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderWithActor = (ui: React.ReactNode, actor: Partial<MePayload> = {}) => {
  const fullActor: MePayload = {
    user: { id: 'u1', email: 'admin@test.com', name: 'Admin' },
    roles: ['editor'],
    permissions: permissionMap(['editor']),
    twoFactorEnabled: false,
    impersonatedBy: null,
    ...actor,
  };
  return render(<ActorProvider actor={fullActor}>{ui}</ActorProvider>);
};

const mockService: Service = {
  id: 's-1',
  name: 'Crash Repair',
  slug: 'crash-repair',
  description: 'Full body crash repairs',
  iconMediaId: null,
  imageMediaId: null,
  checklist: ['Chassis alignment', 'Panel beating'],
  startingPrice: 250,
  content: null,
  displayOrder: 1,
  isEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  icon: null,
  image: null,
};

describe('ServiceTable', () => {
  it('published row shows a pill with text "Published"', () => {
    const { container } = renderWithActor(<ServiceTable initialData={{ data: [mockService], total: 1 }} />);

    const pill = container.querySelector('[data-tone]');
    expect(pill).not.toBeNull();
    expect(pill?.getAttribute('data-tone')).toBe('success');
    expect(pill?.textContent).toBe('Published');
  });

  it('empty data shows the empty-state title and, for editor, the create link', () => {
    renderWithActor(<ServiceTable initialData={{ data: [], total: 0 }} />, {
      roles: ['editor'],
      permissions: permissionMap(['editor']),
    });

    expect(screen.getByText('No services yet')).toBeDefined();
    const createLink = screen.getByRole('link', { name: /Add service/i });
    expect(createLink).toBeDefined();
    expect(createLink.getAttribute('href')).toBe('/dashboard/services/create');
  });

  it('empty data for viewer shows no create link', () => {
    renderWithActor(<ServiceTable initialData={{ data: [], total: 0 }} />, {
      roles: ['viewer'],
      permissions: permissionMap(['viewer']),
    });

    expect(screen.getByText('No services yet')).toBeDefined();
    expect(screen.queryByRole('link', { name: /Add service/i })).toBeNull();
  });
});
