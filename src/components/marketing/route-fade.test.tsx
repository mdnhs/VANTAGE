// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RouteFade } from './route-fade';

const nav = vi.hoisted(() => ({ pathname: '/services' }));

vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

const page = () => (
  <>
    <RouteFade />
    <div data-route-content data-testid='content' />
    <a data-testid='link' {...{ href: '/process' }}>
      Go
    </a>
  </>
);
const content = () => screen.getByTestId('content');

beforeEach(() => {
  nav.pathname = '/services';
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('RouteFade', () => {
  it('never holds up a click: the link navigates straight away', () => {
    render(page());
    const link = screen.getByTestId('link');
    let held = true;
    link.addEventListener('click', (event) => {
      held = event.defaultPrevented;
      event.preventDefault();
    });

    fireEvent.click(link);

    expect(held).toBe(false);
  });

  it('leaves the first page load alone', () => {
    render(page());

    expect(content().style.opacity).toBe('');
  });

  it('fades the new page in when the route changes', async () => {
    const view = render(page());

    nav.pathname = '/process';
    view.rerender(page());

    expect(Number(content().style.opacity)).toBeLessThan(1);
    await waitFor(() => expect(content().style.opacity).toBe(''), { timeout: 2000 });
  });

  it('shows the new page at once for people who prefer reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));
    const view = render(page());

    nav.pathname = '/process';
    view.rerender(page());

    expect(content().style.opacity).toBe('');
  });
});
