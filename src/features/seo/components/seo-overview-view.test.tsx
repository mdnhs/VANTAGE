// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SeoHealth } from '@/lib/seo/health-types';

import { SeoOverviewView } from './seo-overview-view';

const health: SeoHealth = {
  score: 75,
  passed: 6,
  total: 8,
  entities: 1,
  issues: [
    {
      kind: 'page',
      id: 'services',
      title: 'Services',
      path: '/services',
      check: 'title-length',
      message: 'Title is too short',
      fixHref: '/dashboard/services?tab=seo',
    },
    {
      kind: 'page',
      id: 'services',
      title: 'Services',
      path: '/services',
      check: 'description',
      message: 'Description is missing',
      fixHref: '/dashboard/services?tab=seo',
    },
    {
      kind: 'media',
      id: 'm1',
      title: 'hero.jpg',
      path: null,
      check: 'alt-text',
      message: 'Image has no alt text',
      fixHref: '/dashboard/media?missingAlt=true&q=hero.jpg',
    },
  ],
  alt: { images: 5, described: 3, decorative: 1, missing: 1 },
};

let canMedia = true;
vi.mock('@/contexts/actor-provider', () => ({ useCan: () => canMedia }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  canMedia = true;
  fetchMock = vi.fn(async () => json({ success: true, data: health }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderView() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SeoOverviewView />
    </QueryClientProvider>,
  );
}

describe('SeoOverviewView', () => {
  it('renders the gauge with passing and failing checks', async () => {
    renderView();
    const table = await screen.findByRole('table', { name: 'SEO health' });
    expect(within(table).getAllByRole('row').slice(1).map((r) => r.textContent)).toEqual([
      'Passing checks6',
      'Needs work2',
    ]);
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('Healthy')).toBeTruthy();
  });

  it('says how many images are described', async () => {
    renderView();
    expect(await screen.findByText('3 of 5 images described')).toBeTruthy();
    expect(screen.getByText('1 decorative')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Find images without alt text' }).getAttribute('href')).toBe(
      '/dashboard/media?missingAlt=true',
    );
  });

  it('groups issues under one heading per page, with Fix links', async () => {
    renderView();
    const list = await screen.findByRole('list', { name: 'Issues' });
    expect(within(list).getAllByText('Services')).toHaveLength(1);
    expect(within(list).getByText('/services')).toBeTruthy();
    const fix = screen.getByRole('link', { name: 'Fix: Title is too short (Services)' });
    expect(fix.getAttribute('href')).toBe('/dashboard/services?tab=seo');
    expect(screen.getByRole('link', { name: 'Fix: Description is missing (Services)' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Fix: Image has no alt text (hero.jpg)' }).getAttribute('href')).toBe(
      '/dashboard/media?missingAlt=true&q=hero.jpg',
    );
  });

  it('hides the media links without media.read', async () => {
    canMedia = false;
    renderView();
    await screen.findByText('3 of 5 images described');
    expect(screen.queryByRole('link', { name: 'Find images without alt text' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Fix: Image has no alt text (hero.jpg)' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Fix: Title is too short (Services)' })).toBeTruthy();
  });

  it('shows a site issue with no Fix link when it has none', async () => {
    fetchMock.mockResolvedValue(
      json({
        success: true,
        data: {
          ...health,
          issues: [
            {
              kind: 'site',
              id: 'site',
              title: 'Whole site',
              path: null,
              check: 'indexable',
              message: 'Search engines are blocked: SITE_ENV is not set to production',
              fixHref: null,
            },
          ],
        },
      }),
    );
    renderView();
    expect(await screen.findByText('Search engines are blocked: SITE_ENV is not set to production')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^Fix:/ })).toBeNull();
  });

  it('shows the empty state when nothing fails', async () => {
    fetchMock.mockResolvedValue(json({ success: true, data: { ...health, issues: [], passed: 8 } }));
    renderView();
    expect(await screen.findByText('No issues')).toBeTruthy();
    expect(screen.getByText('Every live page passes the checks.')).toBeTruthy();
  });

  it('shows the error and refetches on retry', async () => {
    fetchMock.mockResolvedValueOnce(json({ success: false, error: { message: 'Boom' } }, 500));
    renderView();
    expect(await screen.findByText("SEO health didn't load")).toBeTruthy();
    expect(screen.getByText('Boom')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('3 of 5 images described')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
