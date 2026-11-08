// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { scrollSmoothlyTo } from '@/components/providers/smooth-scroll';

import { SCROLL_DELAY_MS, ScrollToQuoteForm } from './scroll-to-quote-form';

vi.mock('@/components/providers/smooth-scroll', () => ({ scrollSmoothlyTo: vi.fn() }));

const mount = () =>
  render(
    <>
      <header />
      {/* A page the router has hidden but kept in the document, as it does with the homepage. */}
      <main hidden>
        <div data-quote-card data-testid='other-card'>
          <input aria-label='other field' />
        </div>
      </main>
      <main>
        <div data-quote-card data-testid='card'>
          <input aria-label='hidden trap' tabIndex={-1} />
          <input aria-label='first field' />
        </div>
        <ScrollToQuoteForm />
      </main>
    </>,
  );

const setScrollY = (value: number) => Object.defineProperty(window, 'scrollY', { configurable: true, value });
const touchScreen = () =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('hover: none'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(scrollSmoothlyTo).mockReset();
  vi.mocked(scrollSmoothlyTo).mockImplementation((_target, _offset, onArrive) => onArrive?.());
  setScrollY(0);
  window.location.hash = '';
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ScrollToQuoteForm', () => {
  it('waits a moment, then brings the form on this page into view', () => {
    mount();

    vi.advanceTimersByTime(SCROLL_DELAY_MS - 1);
    expect(scrollSmoothlyTo).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(vi.mocked(scrollSmoothlyTo).mock.calls[0]![0]).toBe(screen.getByTestId('card'));
  });

  it.each(['wheel', 'touchMove', 'pointerDown'] as const)('is not put off by a stray %s', (event) => {
    mount();

    fireEvent[event](window);
    vi.advanceTimersByTime(SCROLL_DELAY_MS);

    expect(scrollSmoothlyTo).toHaveBeenCalledOnce();
  });

  it('puts the cursor in the first field on arrival', () => {
    mount();

    vi.advanceTimersByTime(SCROLL_DELAY_MS);

    expect(document.activeElement).toBe(screen.getByLabelText('first field'));
  });

  it('does not open the on-screen keyboard on a phone', () => {
    touchScreen();
    mount();

    vi.advanceTimersByTime(SCROLL_DELAY_MS);

    expect(scrollSmoothlyTo).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(document.body);
  });

  it('leaves alone a visitor who has already moved down the page', () => {
    mount();

    setScrollY(600);
    vi.advanceTimersByTime(SCROLL_DELAY_MS);

    expect(scrollSmoothlyTo).not.toHaveBeenCalled();
  });

  it('respects a link to a specific place on the page', () => {
    window.location.hash = '#estimator';
    mount();

    vi.advanceTimersByTime(SCROLL_DELAY_MS);

    expect(scrollSmoothlyTo).not.toHaveBeenCalled();
  });

  it('does nothing once the visitor has left the page', () => {
    const view = mount();

    view.unmount();
    vi.advanceTimersByTime(SCROLL_DELAY_MS);

    expect(scrollSmoothlyTo).not.toHaveBeenCalled();
  });
});
