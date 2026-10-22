// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

// MapLibre throws "Failed to initialize WebGL" when the browser has no WebGL.
vi.mock('maplibre-gl', async (importOriginal) => {
  const original = await importOriginal<typeof import('maplibre-gl')>();
  const Failing = vi.fn(function Map() {
    throw new Error('Failed to initialize WebGL');
  });
  return { ...original, Map: Failing, default: { ...original, Map: Failing } };
});

import { Map } from './map';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('does not crash the page when WebGL is unavailable', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(
    <Map center={[0, 0]} zoom={3}>
      <span>child</span>
    </Map>,
  );
  expect(container.textContent).not.toContain('child');
  expect(warn).toHaveBeenCalled();
});

it('shows a Google Maps link instead of the spinner when the centre is known', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container, findByText } = render(<Map center={[-6.2603, 53.3498]} zoom={14} />);
  const link = await findByText('Open in Google Maps');
  expect(link.getAttribute('href')).toBe('https://www.google.com/maps/search/?api=1&query=53.3498,-6.2603');
  expect(link.getAttribute('target')).toBe('_blank');
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  expect(container.querySelector('.animate-pulse')).toBeNull();
});

it.each([
  ['missing', undefined],
  ['NaN', [Number.NaN, 53]],
  ['Infinity', [-6, Number.POSITIVE_INFINITY]],
  ['wrong length', [1, 2, 3]],
])('renders no link when the centre is %s', (_name, center) => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { container } = render(<Map {...({ center } as object)} zoom={3} />);
  expect(container.querySelector('a')).toBeNull();
  expect(container.querySelector('.animate-pulse')).toBeNull();
});
