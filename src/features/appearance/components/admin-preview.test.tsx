// @vitest-environment happy-dom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeConfig } from '@/lib/theme/schema';

import { useLiveAdmin } from './admin-preview';

const theme = vi.hoisted(() => ({ resolved: 'light' as string | undefined }));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: theme.resolved }) }));

const adminWith = (mode: 'system' | 'light' | 'dark') => ThemeConfig.parse({ admin: { mode } }).admin;
const html = () => document.documentElement;

beforeEach(() => {
  theme.resolved = 'light';
  html().className = 'light';
});
afterEach(() => {
  cleanup();
  html().className = '';
});

describe('useLiveAdmin mode', () => {
  it('applies a draft dark mode over a published light one, and restores it on unmount', () => {
    const { unmount } = renderHook(() => useLiveAdmin(adminWith('dark')));
    expect(html().classList.contains('dark')).toBe(true);
    expect(html().classList.contains('light')).toBe(false);
    expect(html().style.colorScheme).toBe('dark');
    unmount();
    expect(html().style.colorScheme).toBe('');
    expect(html().classList.contains('dark')).toBe(false);
    expect(html().classList.contains('light')).toBe(true);
  });

  it('applies a draft light mode over a published dark one, and restores it on unmount', () => {
    theme.resolved = 'dark';
    html().className = 'dark';
    const { unmount } = renderHook(() => useLiveAdmin(adminWith('light')));
    expect(html().classList.contains('dark')).toBe(false);
    unmount();
    expect(html().classList.contains('dark')).toBe(true);
  });

  it('leaves the classes alone for a system draft', () => {
    const { unmount } = renderHook(() => useLiveAdmin(adminWith('system')));
    expect(html().className).toBe('light');
    unmount();
    expect(html().className).toBe('light');
  });
});
