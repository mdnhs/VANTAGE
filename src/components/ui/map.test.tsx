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
