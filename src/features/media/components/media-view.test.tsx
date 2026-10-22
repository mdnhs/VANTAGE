// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaView } from './media-view';

const useMediaList = vi.hoisted(() => vi.fn());
vi.mock('../hooks/use-media', () => ({ useMediaList }));
vi.mock('@/contexts/actor-provider', () => ({
  useActor: () => ({ roles: ['owner'], impersonatedBy: null, user: { id: 'u1' } }),
  useCan: () => false,
}));
vi.mock('./media-details-sheet', () => ({ MediaDetailsSheet: () => null }));
vi.mock('./media-grid', () => ({ MediaGrid: () => null }));
vi.mock('./upload-dropzone', () => ({ UploadDropzone: () => null }));

beforeEach(() => {
  useMediaList.mockReturnValue({
    isPending: false,
    isError: false,
    items: [],
    hasNextPage: false,
    isFetchingNextPage: false,
  });
});
afterEach(() => {
  cleanup();
  useMediaList.mockReset();
});

function renderView(searchParams: string, onUrlUpdate?: OnUrlUpdateFunction) {
  render(
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate}>
      <MediaView />
    </NuqsTestingAdapter>,
  );
}

describe('MediaView URL filters', () => {
  it('starts from ?missingAlt=true&q=hero.jpg', () => {
    renderView('?missingAlt=true&q=hero.jpg');
    expect(screen.getByRole('switch', { name: 'Missing alt text' }).getAttribute('aria-checked')).toBe('true');
    expect((screen.getByLabelText('Search the library') as HTMLInputElement).value).toBe('hero.jpg');
    expect(useMediaList).toHaveBeenLastCalledWith({ q: 'hero.jpg', type: undefined, missingAlt: true });
  });

  it('defaults to no filters', () => {
    renderView('');
    expect(screen.getByRole('switch', { name: 'Missing alt text' }).getAttribute('aria-checked')).toBe('false');
    expect(useMediaList).toHaveBeenLastCalledWith({ q: undefined, type: undefined, missingAlt: undefined });
  });

  it('writes the toggle to the URL and clears it at the default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderView('', onUrlUpdate);
    fireEvent.click(screen.getByRole('switch', { name: 'Missing alt text' }));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    expect(onUrlUpdate.mock.calls.at(-1)![0].searchParams.get('missingAlt')).toBe('true');
    fireEvent.click(screen.getByRole('switch', { name: 'Missing alt text' }));
    await waitFor(() => expect(onUrlUpdate.mock.calls.at(-1)![0].searchParams.has('missingAlt')).toBe(false));
  });
});
