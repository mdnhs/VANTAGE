// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CrawlPreview } from './crawl-preview';

const sitemap = (n: number) =>
  `<urlset>${Array.from({ length: n }, (_, i) => `<url><loc>https://x.ie/p${i}</loc></url>`).join('')}</urlset>`;

let robotsStatus = 200;
beforeEach(() => {
  robotsStatus = 200;
  vi.stubGlobal('fetch', (url: string) =>
    Promise.resolve(
      url === '/robots.txt'
        ? new Response('User-agent: *', { status: robotsStatus })
        : new Response(sitemap(22), { status: 200 }),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const renderIt = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CrawlPreview />
    </QueryClientProvider>,
  );

describe('CrawlPreview', () => {
  it('counts sitemap addresses and lists the first 20', async () => {
    renderIt();
    fireEvent.click(screen.getByRole('tab', { name: 'Sitemap' }));
    expect(await screen.findByText('22 addresses')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(20);
    expect(screen.getByText('and 2 more')).toBeTruthy();
  });

  it('shows the failing file when robots.txt does not answer', async () => {
    robotsStatus = 500;
    renderIt();
    expect((await screen.findByRole('alert')).textContent).toBe('/robots.txt answered 500');
  });
});
