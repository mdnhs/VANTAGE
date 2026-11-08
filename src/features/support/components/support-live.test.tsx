// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportLive } from './support-live';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}));

class FakeEventSource {
  static open: FakeEventSource[] = [];
  closed = false;
  constructor() {
    FakeEventSource.open.push(this);
  }
  addEventListener() {}
  close() {
    this.closed = true;
  }
}

const live = () => FakeEventSource.open.filter((s) => !s.closed);

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  act(() => void document.dispatchEvent(new Event('visibilitychange')));
}

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SupportLive />
    </QueryClientProvider>,
  );

describe('SupportLive presence', () => {
  beforeEach(() => {
    FakeEventSource.open = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('holds one stream while the tab is visible', () => {
    mount();
    expect(live()).toHaveLength(1);
  });

  it('opens no stream for a tab that loads in the background', () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    mount();
    expect(live()).toHaveLength(0);
  });

  it('drops the stream when the tab is hidden', () => {
    mount();
    setVisibility('hidden');
    expect(live()).toHaveLength(0);
  });

  it('reconnects once when the tab comes back', () => {
    mount();
    setVisibility('hidden');
    setVisibility('visible');
    setVisibility('visible');
    expect(live()).toHaveLength(1);
  });

  it('closes the stream on unmount', () => {
    const view = mount();
    view.unmount();
    expect(live()).toHaveLength(0);
  });
});
