'use client';

import { useEffect } from 'react';

type KeyLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>;
type PaletteKeyEvent = KeyLike & Pick<KeyboardEvent, 'repeat' | 'defaultPrevented' | 'target' | 'preventDefault'>;

// ⌘K on macOS, Ctrl+K elsewhere. A modifier is required, so typing a bare "k"
// never opens the palette (no single-key hotkeys).
export function isPaletteShortcut(event: KeyLike) {
  return event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
}

// Rich-text editors (a contenteditable root) use ⌘K for links, so they keep
// it. Plain inputs, textareas and selects do not: a modifier chord is never
// typed text, and users expect ⌘K from filter fields.
function isRichText(target: EventTarget | null) {
  if (typeof HTMLElement === 'undefined' || !(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest('[contenteditable]:not([contenteditable="false"])') !== null;
}

export function handlePaletteKey(event: PaletteKeyEvent, onTrigger: () => void) {
  if (event.repeat || event.defaultPrevented) return;
  if (!isPaletteShortcut(event) || isRichText(event.target)) return;
  event.preventDefault();
  onTrigger();
}

export function useCommandHotkey(onTrigger: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handlePaletteKey(event, onTrigger);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onTrigger]);
}
