import { describe, expect, it, vi } from 'vitest';

import { handlePaletteKey, isPaletteShortcut } from './use-command-hotkey';

const key = (over: Partial<Parameters<typeof isPaletteShortcut>[0]> = {}) => ({
  key: 'k',
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...over,
});

describe('isPaletteShortcut', () => {
  it('accepts Cmd+K and Ctrl+K in either case', () => {
    expect(isPaletteShortcut(key({ metaKey: true }))).toBe(true);
    expect(isPaletteShortcut(key({ ctrlKey: true, key: 'K' }))).toBe(true);
  });

  it('ignores a bare k, other keys, and alt or shift chords', () => {
    expect(isPaletteShortcut(key())).toBe(false);
    expect(isPaletteShortcut(key({ metaKey: true, key: 'j' }))).toBe(false);
    expect(isPaletteShortcut(key({ metaKey: true, altKey: true }))).toBe(false);
    expect(isPaletteShortcut(key({ ctrlKey: true, shiftKey: true }))).toBe(false);
  });
});

describe('handlePaletteKey', () => {
  const event = (over: object = {}) => ({
    ...key({ metaKey: true }),
    repeat: false,
    defaultPrevented: false,
    target: null,
    preventDefault: vi.fn(),
    ...over,
  });

  it('toggles once and prevents the browser default', () => {
    const onTrigger = vi.fn();
    const e = event();
    handlePaletteKey(e, onTrigger);
    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('ignores auto-repeat and already-handled events', () => {
    const onTrigger = vi.fn();
    handlePaletteKey(event({ repeat: true }), onTrigger);
    handlePaletteKey(event({ defaultPrevented: true }), onTrigger);
    expect(onTrigger).not.toHaveBeenCalled();
  });
});
