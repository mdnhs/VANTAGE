// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/services' }));

import { PreviewBar } from './preview-bar';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('PreviewBar', () => {
  it('offers Exit preview on the page itself', () => {
    render(<PreviewBar />);
    expect(screen.getByRole('link', { name: 'Exit preview' }).getAttribute('href')).toContain('/preview/exit');
  });

  it('hides Exit preview inside a frame, where it would turn the preview into the live site', () => {
    vi.stubGlobal('top', {});
    render(<PreviewBar />);
    expect(screen.getByText('Previewing the draft theme')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Exit preview' })).toBeNull();
  });
});
