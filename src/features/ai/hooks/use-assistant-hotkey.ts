'use client';

import { useEffect } from 'react';

type KeyLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>;

// ⌘J / Ctrl+J. Unlike ⌘K it also works inside the rich-text editor: TipTap
// binds no Mod-j, and that is where people most want help (it binds no Mod-j).
export function isAssistantShortcut(event: KeyLike) {
  return event.key.toLowerCase() === 'j' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
}

export function useAssistantHotkey(enabled: boolean, onTrigger: () => void) {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.isComposing || event.defaultPrevented || !isAssistantShortcut(event)) return;
      // Another modal (a confirm, the command palette) owns the keyboard; the
      // assistant's own sheet is marked so ⌘J can still close it.
      if (document.querySelector('[role="dialog"][aria-modal="true"]:not([data-ai-assistant])')) return;
      event.preventDefault();
      onTrigger();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, onTrigger]);
}
