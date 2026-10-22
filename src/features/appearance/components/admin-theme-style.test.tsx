// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { adminThemeCss } from '@/lib/theme/css';
import { DEFAULT_THEME, ThemeConfig } from '@/lib/theme/schema';

import { AdminThemeStyle } from './admin-theme-style';

afterEach(cleanup);

it('renders nothing for the default theme', () => {
  const { container } = render(<AdminThemeStyle theme={DEFAULT_THEME} />);
  expect(container.innerHTML).toBe('');
});

it('renders one style#theme-tokens holding the admin CSS', () => {
  const theme = ThemeConfig.parse({ admin: { preset: 'ocean' } });
  const { container } = render(<AdminThemeStyle theme={theme} />);
  const styles = container.querySelectorAll('style#theme-tokens');
  expect(styles).toHaveLength(1);
  expect(styles[0]!.textContent).toBe(adminThemeCss(theme.admin));
  expect(styles[0]!.textContent).toContain(':root:has([data-admin-root]){');
});
