// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';
import { HOME_DESCRIPTION } from '@/lib/seo/public-pages';

import { SeoAside } from './seo-aside';

let globalsDenied = false;
let siteGlobalDenied = false;
let seoValue: Record<string, unknown> = {};
let publicSite: Record<string, unknown> = { businessName: 'Vantage Autobody' };
beforeEach(() => {
  globalsDenied = false;
  siteGlobalDenied = false;
  seoValue = {};
  publicSite = { businessName: 'Vantage Autobody' };
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
  vi.stubGlobal('fetch', (url: string) => {
    if (
      (globalsDenied && url.includes('/admin/globals/')) ||
      (siteGlobalDenied && url.endsWith('/admin/globals/site')) ||
      (globalsDenied && url.endsWith('/site-settings'))
    ) {
      return Promise.resolve(
        new Response(JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'No' } }), { status: 403 }),
      );
    }
    if (url.endsWith('/site-settings')) {
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: publicSite })));
    }
    const key = url.split('/admin/globals/')[1];
    const value = parseGlobal('seo', seoValue);
    return Promise.resolve(new Response(JSON.stringify({ success: true, data: { key, version: 1, value } })));
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const values = (patch: Record<string, unknown>) => ({ ...parseGlobal('seo.page.services', {}), ...patch });
const renderAside = (patch: Record<string, unknown>) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SeoAside id='services' values={values(patch)} />
    </QueryClientProvider>,
  );

describe('SeoAside', () => {
  it('applies the site template to a typed SEO title', async () => {
    renderAside({ title: 'Bodywork' });
    expect((await screen.findAllByText('Bodywork | Vantage Autobody')).length).toBeGreaterThan(0);
  });

  it('flags a short description in the checklist', async () => {
    renderAside({ description: 'a'.repeat(20) });
    const item = (await screen.findByText('Description is 20 characters (aim for 70–160)')).closest('li');
    expect(item?.textContent).toBe('Needs work: Description is 20 characters (aim for 70–160)');
  });

  it('says so when the page is hidden from search engines', async () => {
    renderAside({ noindex: true });
    expect(await screen.findByText('Hidden from search engines')).toBeTruthy();
  });

  it('says the page is hidden when the whole site is noindex', async () => {
    seoValue = { robots: 'noindex' };
    renderAside({ noindex: false });
    expect(await screen.findByText('Hidden from search engines')).toBeTruthy();
  });

  it('grades the description the home page ships, using the seo defaultDescription when set and falling back to HOME_DESCRIPTION when empty', async () => {
    const derived = 'Vantage Autobody — Mon-Fri 9-5, a description of a comfortable and rather useful length here';
    seoValue = { defaultDescription: derived };
    const { unmount } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <SeoAside id='home' values={parseGlobal('seo.page.home', {})} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText(new RegExp(`Description is ${derived.length} characters`))).toBeTruthy();
    unmount();

    seoValue = { defaultDescription: '' };
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <SeoAside id='home' values={parseGlobal('seo.page.home', {})} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText(new RegExp(`Description is ${HOME_DESCRIPTION.length} characters`))).toBeTruthy();
  });

  it('shows the shipped title even when the site global is not readable (site name from the public settings)', async () => {
    siteGlobalDenied = true;
    renderAside({});
    expect((await screen.findAllByText('Services | Vantage Autobody')).length).toBeGreaterThan(0);
  });

  it('shows a placeholder and skips the size check for a legacy image', async () => {
    renderAside({ ogImage: { kind: 'cloudinary', publicId: 'old/pic' } });
    expect(await screen.findByText('Legacy image — no preview')).toBeTruthy();
    expect((await screen.findByText('Legacy image — size not checked')).closest('li')?.textContent).toContain(
      'Not checked:',
    );
  });

  it('still renders from the page label when the defaults cannot be read', async () => {
    globalsDenied = true;
    renderAside({});
    expect((await screen.findAllByText('Services')).length).toBeGreaterThan(0);
    expect(screen.getByText('In search results')).toBeTruthy();
  });
});
