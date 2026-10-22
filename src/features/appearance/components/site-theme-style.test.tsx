// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/services' }));
vi.mock('@/server/queries/get-theme', () => ({ getSiteThemeForRender: vi.fn() }));

import { siteThemeCss } from '@/lib/theme/css';
import { DEFAULT_THEME, ThemeConfig } from '@/lib/theme/schema';

import { SiteThemeMarkup } from './site-theme-style';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_PREFIX', '/api');
  vi.stubEnv('NEXT_PUBLIC_API_VERSION', '/v1');
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

it('renders nothing for the default theme', () => {
  const { container } = render(<SiteThemeMarkup site={DEFAULT_THEME.site} preview={false} />);
  expect(container.innerHTML).toBe('');
});

it('renders one style#theme-tokens holding the site CSS', () => {
  const site = ThemeConfig.parse({ site: { brand: '#2563eb' } }).site;
  const { container } = render(<SiteThemeMarkup site={site} preview={false} />);
  const styles = container.querySelectorAll('style#theme-tokens');
  expect(styles).toHaveLength(1);
  expect(styles[0]!.textContent).toBe(siteThemeCss(site));
  expect(screen.queryByText('Exit preview')).toBeNull();
});

it('shows the preview bar with a full-navigation exit link while previewing', () => {
  render(<SiteThemeMarkup site={DEFAULT_THEME.site} preview />);
  expect(screen.getByText('Previewing the draft theme')).toBeTruthy();
  expect(screen.getByText('Exit preview').getAttribute('href')).toBe('/api/v1/preview/exit?path=%2Fservices');
});
