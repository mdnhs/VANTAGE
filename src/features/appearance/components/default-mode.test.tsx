// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const setTheme = vi.hoisted(() => vi.fn());
vi.mock('next-themes', () => ({ useTheme: () => ({ setTheme }) }));

import { AUTO_MARKER_KEY, DefaultMode } from './default-mode';

const KEY = 'theme';

beforeEach(() => {
  localStorage.clear();
  setTheme.mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('applies the published mode on a first visit and records the marker', () => {
  render(<DefaultMode mode='dark' />);
  expect(setTheme).toHaveBeenCalledWith('dark');
  expect(localStorage.getItem(AUTO_MARKER_KEY)).toBe('dark');
});

it('follows a changed published mode when the stored theme is the marker', () => {
  localStorage.setItem(KEY, 'dark');
  localStorage.setItem(AUTO_MARKER_KEY, 'dark');
  render(<DefaultMode mode='light' />);
  expect(setTheme).toHaveBeenCalledWith('light');
  expect(localStorage.getItem(AUTO_MARKER_KEY)).toBe('light');
});

it('applies system when the stored theme is the system marker', () => {
  localStorage.setItem(KEY, 'system');
  localStorage.setItem(AUTO_MARKER_KEY, 'system');
  render(<DefaultMode mode='light' />);
  expect(setTheme).toHaveBeenCalledWith('light');
});

it('never overrides a theme the user chose and clears the marker', () => {
  localStorage.setItem(KEY, 'light');
  localStorage.setItem(AUTO_MARKER_KEY, 'dark');
  render(<DefaultMode mode='dark' />);
  expect(setTheme).not.toHaveBeenCalled();
  expect(localStorage.getItem(AUTO_MARKER_KEY)).toBeNull();
});

it('treats a stored theme with no marker as a user choice', () => {
  localStorage.setItem(KEY, 'light');
  render(<DefaultMode mode='dark' />);
  expect(setTheme).not.toHaveBeenCalled();
  expect(localStorage.getItem(AUTO_MARKER_KEY)).toBeNull();
});

it('does not crash when storage throws', () => {
  const blocked = () => {
    throw new Error('blocked');
  };
  vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });
  expect(() => render(<DefaultMode mode='dark' />)).not.toThrow();
  expect(setTheme).not.toHaveBeenCalled();
});
