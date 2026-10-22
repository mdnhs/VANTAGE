import { afterEach, describe, expect, it, vi } from 'vitest';

// The unit project runs in the node environment: stub the browser globals the hook
// reads and let useSyncExternalStore resolve to its client snapshot.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useCallback: (fn: unknown) => fn,
    useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
  };
});

import { useIsMobile } from './use-mobile';

function stubViewport(width: number) {
  vi.stubGlobal('window', {
    innerWidth: width,
    matchMedia: (query: string) => {
      const max = Number(/max-width:\s*(\d+)px/.exec(query)?.[1]);
      return { matches: width <= max, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    },
  });
}

describe('useIsMobile', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is mobile at 1023px', () => {
    stubViewport(1023);
    expect(useIsMobile()).toBe(true);
  });

  it('is desktop at 1024px', () => {
    stubViewport(1024);
    expect(useIsMobile()).toBe(false);
  });
});
