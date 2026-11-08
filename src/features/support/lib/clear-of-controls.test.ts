import { describe, expect, it } from 'vitest';

import { liftToClear } from './clear-of-controls';

const widget = { left: 900, right: 1256, top: 720, bottom: 784 };
const control = (left: number, top: number) => ({ left, right: left + 52, top, bottom: top + 52 });

describe('liftToClear', () => {
  it('stays put when nothing is underneath', () => {
    expect(liftToClear(widget, [control(200, 736)], 12)).toBe(0);
  });

  it('rises just far enough to clear a control underneath, plus the gap', () => {
    expect(liftToClear(widget, [control(1100, 736)], 12)).toBe(60);
  });

  it('clears the highest of several controls', () => {
    expect(liftToClear(widget, [control(1100, 760), control(1160, 736)], 12)).toBe(60);
  });

  it('ignores a control that is above or below the widget', () => {
    expect(liftToClear(widget, [control(1100, 300), control(1100, 900)], 12)).toBe(0);
  });
});
