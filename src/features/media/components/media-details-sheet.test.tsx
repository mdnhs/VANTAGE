// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MediaApiError } from '../services/api';
import type { MediaItem } from '../types';
import { MediaDetailsSheet } from './media-details-sheet';

const remove = vi.hoisted(() => vi.fn());
vi.mock('../hooks/use-media', () => ({
  mediaKeys: { all: ['media'] },
  useMediaUsage: () => ({ isPending: false, isError: false, data: [] }),
  useUpdateMedia: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteMedia: () => ({ mutateAsync: remove }),
}));
vi.mock('@/contexts/actor-provider', () => ({
  useActor: () => ({ roles: ['owner'], impersonatedBy: null, user: { id: 'u1' } }),
}));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const item = {
  id: 'm1',
  url: '/uploads/a.png',
  filename: 'a.png',
  mimeType: 'image/png',
  width: 10,
  height: 10,
  alt: '',
  caption: null,
  focalX: 0.5,
  focalY: 0.5,
  isDecorative: false,
  createdBy: 'u1',
} as unknown as MediaItem;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('MediaDetailsSheet', () => {
  it('shows the usage list with links when delete is refused with 409', async () => {
    vi.stubGlobal('confirm', () => true);
    window.confirm = () => true;
    remove.mockRejectedValue(
      new MediaApiError(
        'This file is still in use',
        409,
        'CONFLICT',
        {},
        {
          usage: [{ kind: 'setting', id: 'site', label: 'Identity', href: '/dashboard/settings/identity' }],
        },
      ),
    );
    render(<MediaDetailsSheet item={item} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete file' }));
    const alert = await waitFor(() => screen.getByRole('alert'));
    expect(alert.textContent).toContain('This file is still in use');
    const link = alert.querySelector('a');
    expect(link?.textContent).toBe('Identity');
    expect(link?.getAttribute('href')).toBe('/dashboard/settings/identity');
  });
});
