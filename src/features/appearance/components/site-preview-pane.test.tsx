// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SitePreviewPane } from './site-preview-pane';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('SitePreviewPane', () => {
  it('refreshes by re-entering preview (re-setting src), not by reloading the frame', () => {
    const { container, rerender } = render(<SitePreviewPane path='/' refreshKey={0} />);
    const frame = container.querySelector('iframe')!;
    const sets: string[] = [];
    const proto = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
    Object.defineProperty(frame, 'src', {
      configurable: true,
      get: () => proto?.get?.call(frame) ?? '',
      set: (value: string) => sets.push(value),
    });
    rerender(<SitePreviewPane path='/' refreshKey={1} />);
    expect(sets).toHaveLength(1);
    expect(sets[0]).toContain('/preview?path=%2F');
  });
});
