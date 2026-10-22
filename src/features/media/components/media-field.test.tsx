// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MediaField } from './media-field';

vi.mock('../hooks/use-media', () => ({
  useMediaByIds: () => ({ data: [] }),
  useMediaList: () => ({ items: [], isPending: true, isError: false, hasNextPage: false }),
}));
vi.mock('@/contexts/actor-provider', () => ({
  useActor: () => ({ roles: ['owner'], impersonatedBy: null, user: { id: 'u1' } }),
  useCan: () => true,
}));

const wrap = (ui: React.ReactElement) => <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>;
afterEach(cleanup);

describe('MediaField', () => {
  it('offers Choose when empty and Change/Remove for a media ref', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      wrap(<MediaField kind='image' label='Hero' value={null} nullable onChange={onChange} />),
    );
    expect(screen.getByRole('button', { name: /choose hero image/i }).textContent).toBe('Choose image');
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();
    rerender(
      wrap(
        <MediaField
          kind='image'
          label='Hero'
          value={{ kind: 'media', id: '5c1b0f1e-3b49-4f5e-8a53-1a0c2b9d7e11' }}
          nullable
          onChange={onChange}
        />,
      ),
    );
    expect(screen.getByRole('button', { name: /change hero image/i }).textContent).toBe('Change image');
    fireEvent.click(screen.getByRole('button', { name: /remove hero image/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('flags a legacy Cloudinary ref and lets it be replaced or removed', () => {
    render(
      wrap(
        <MediaField
          kind='image'
          label='Hero'
          value={{ kind: 'cloudinary', publicId: 'x' }}
          nullable
          onChange={vi.fn()}
        />,
      ),
    );
    expect(screen.getByText(/Legacy image — choose a new one to replace it/)).not.toBeNull();
    expect(screen.getByRole('button', { name: /change hero image/i })).not.toBeNull();
    expect(screen.getByRole('button', { name: /remove hero image/i })).not.toBeNull();
  });

  it('hides Remove when the slot is not nullable', () => {
    render(wrap(<MediaField kind='video' label='Clip' value={{ kind: 'media', id: 'a' }} onChange={vi.fn()} />));
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();
    expect(screen.getByRole('button', { name: /change clip video/i }).textContent).toBe('Change video');
  });
});
