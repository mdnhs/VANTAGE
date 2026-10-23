// @vitest-environment happy-dom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isAssistantShortcut, useAssistantHotkey } from './use-assistant-hotkey';

const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', { key: 'j', cancelable: true, ...init });

afterEach(cleanup);

describe('⌘J / Ctrl+J shortcut', () => {
  it('needs exactly one modifier', () => {
    expect(isAssistantShortcut(key({ metaKey: true }))).toBe(true);
    expect(isAssistantShortcut(key({ ctrlKey: true }))).toBe(true);
    expect(isAssistantShortcut(key({}))).toBe(false);
    expect(isAssistantShortcut(key({ metaKey: true, shiftKey: true }))).toBe(false);
    expect(isAssistantShortcut(key({ key: 'k', metaKey: true }))).toBe(false);
  });

  it('ignores IME composition and any other open modal, but not its own sheet', () => {
    const fn = vi.fn();
    renderHook(() => useAssistantHotkey(true, fn));
    window.dispatchEvent(key({ ctrlKey: true, isComposing: true }));
    expect(fn).not.toHaveBeenCalled();
    const other = document.createElement('div');
    other.setAttribute('role', 'dialog');
    other.setAttribute('aria-modal', 'true');
    document.body.append(other);
    window.dispatchEvent(key({ ctrlKey: true }));
    expect(fn).not.toHaveBeenCalled();
    other.setAttribute('data-ai-assistant', '');
    window.dispatchEvent(key({ ctrlKey: true }));
    expect(fn).toHaveBeenCalledTimes(1);
    other.remove();
  });

  it('fires once per press, only while enabled, and claims the key', () => {
    const fn = vi.fn();
    const { rerender } = renderHook(({ on }) => useAssistantHotkey(on, fn), {
      initialProps: { on: true },
    });
    const e = key({ ctrlKey: true });
    window.dispatchEvent(e);
    window.dispatchEvent(key({ ctrlKey: true, repeat: true }));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
    rerender({ on: false });
    window.dispatchEvent(key({ ctrlKey: true }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
