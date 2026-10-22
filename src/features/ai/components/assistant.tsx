'use client';

import { lazy, Suspense, useCallback, useRef, useState } from 'react';

import { AiSparkleIcon } from '@/components/admin/icons/ai-sparkle-icon';
import { ICON_BUTTON } from '@/components/admin/shell/constants';
import { Button } from '@/components/ui/button';

import { useAiStatus } from '../hooks/use-ai-status';
import { useAssistantHotkey } from '../hooks/use-assistant-hotkey';

// The chat (AI SDK client, Markdown, panel) is a separate chunk: only the
// button, the status query and the shortcut load with every admin route.
const loadSheet = () => import('./assistant-sheet');
const AssistantSheet = lazy(loadSheet);

// Lives in the topbar, which the panel layout keeps mounted across
// navigation, so the conversation (held by the sheet once it has loaded)
// survives route changes.
export function AiAssistant() {
  const status = useAiStatus();
  const [open, setOpen] = useState(false);
  // Mounted on first open, then kept, so closing the sheet keeps the chat.
  const [loaded, setLoaded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const s = status.data;
  const visible = Boolean(s && (s.available || s.canManage));
  const toggle = useCallback(() => {
    setLoaded(true);
    setOpen((v) => !v);
  }, []);
  useAssistantHotkey(visible, toggle);

  if (!visible || !s) return null;
  return (
    <>
      <Button
        ref={trigger}
        variant='outline'
        size='icon-lg'
        className={ICON_BUTTON}
        aria-label='AI assistant'
        aria-keyshortcuts='Meta+J Control+J'
        // Start the download on intent, before the click.
        onPointerEnter={() => void loadSheet()}
        onFocus={() => void loadSheet()}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
      >
        <AiSparkleIcon />
      </Button>
      {loaded ? (
        <Suspense fallback={null}>
          <AssistantSheet status={s} open={open} onOpenChange={setOpen} trigger={trigger} composer={composer} />
        </Suspense>
      ) : null}
    </>
  );
}
