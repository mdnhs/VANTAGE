'use client';

import { Headset, SendHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { VisitorConversationDto } from '@/lib/support/types';
import { SUPPORT_MESSAGE_MAX } from '@/validations/support-schema';

import { countUnread } from '../../lib/unread';
import { VISITOR_STREAM_URL, visitorApi } from '../../services/visitor-api';
import { ChatHint } from './chat-hint';
import { useChatMoments } from './use-chat-moments';
import { useWidgetMotion } from './use-widget-motion';

// Remembers only UI state (no message text, no identity). The chat itself is proven by an httpOnly cookie.
const STORAGE_KEY = 'support-chat';
const TYPING_TIMEOUT_MS = 25_000;
type Stored = { active?: boolean; seenId?: string };

const readStored = (): Stored => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Stored;
  } catch {
    return {};
  }
};
const writeStored = (patch: Stored) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStored(), ...patch }));
  } catch {
    // Private windows can refuse storage; the chat still works for this page view.
  }
};

const FIELD =
  'w-full rounded-[10px] border border-white/15 bg-white/[0.05] px-3 py-2.5 text-[15px] text-[#f1f3f6] placeholder:text-white/45 focus-visible:border-white/40 focus-visible:outline-none';

export function SupportWidget({ retentionMonths }: { retentionMonths: number }) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(false);
  const [hintHidden, setHintHidden] = useState(true);
  const [hintEntered, setHintEntered] = useState(false);
  const [conversation, setConversation] = useState<VisitorConversationDto | null>(null);
  const [seenId, setSeenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which visitor message the "typing" hint gave up on, so a silent failure never shows it forever.
  const [typingGaveUp, setTypingGaveUp] = useState<string | null>(null);

  const { panel, launcher, chatIcon, closeIcon, panelMounted } = useWidgetMotion(ready, open);
  const composer = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const unread = open || !conversation ? 0 : countUnread(conversation.messages, seenId);
  const { badge, avatar, statusLine, onlineDot } = useChatMoments({
    open,
    panelMounted,
    messageIds: conversation?.messages.map((m) => m.id) ?? [],
    unread,
    agentName: conversation?.agentName ?? null,
    online,
    launcher,
    log,
  });

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const next = await visitorApi.conversation();
      // Two events close together: only the newest read may land.
      if (id !== requestId.current) return;
      setConversation(next);
      if (!next) writeStored({ active: false, seenId: undefined });
    } catch {
      // The next event or reconnect reads again.
    }
  }, []);

  useEffect(() => {
    // The Appearance preview frames the public site; a chat button has no place there.
    if (window.self !== window.top) return;
    const stored = readStored();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values, read after hydration
    setReady(true);
    setHintHidden(false);
    setSeenId(stored.seenId ?? null);
    visitorApi.status().then(
      (s) => setOnline(s.online),
      () => {},
    );
    if (stored.active) void refresh();
  }, [refresh]);

  const conversationId = conversation?.status === 'open' ? conversation.id : null;
  useEffect(() => {
    if (!conversationId) return;
    const stream = new EventSource(VISITOR_STREAM_URL);
    const onEvent = () => void refresh();
    for (const name of ['ready', 'resync', 'message', 'conversation']) stream.addEventListener(name, onEvent);
    return () => stream.close();
  }, [conversationId, refresh]);

  const lastMessageId = conversation?.messages.at(-1)?.id ?? null;
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- an open panel has read everything in it
    setSeenId(lastMessageId);
    writeStored({ seenId: lastMessageId ?? undefined });
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [open, lastMessageId]);

  useEffect(() => {
    if (open) composer.current?.focus({ preventScroll: true });
  }, [open]);

  const waitingForAi = Boolean(conversation?.aiActive) && conversation?.messages.at(-1)?.sender === 'visitor';
  useEffect(() => {
    if (!waitingForAi || !lastMessageId) return;
    const timer = setTimeout(() => setTypingGaveUp(lastMessageId), TYPING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [waitingForAi, lastMessageId]);

  if (!ready) return null;

  const close = () => {
    setOpen(false);
    launcher.current?.focus();
  };

  const openPanel = (topic?: string) => {
    if (topic) setDraft((current) => current || topic);
    setOpen(true);
    setError(null);
    visitorApi.status().then(
      (s) => setOnline(s.online),
      () => {},
    );
  };

  const ended = conversation?.status === 'closed';

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    requestId.current++;
    try {
      const next = conversation
        ? await visitorApi.send(body)
        : await visitorApi.start({ body, sourcePath: window.location.pathname, website: honeypot });
      setConversation(next);
      setDraft('');
      writeStored({ active: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong, please try again');
    } finally {
      setSending(false);
    }
  };

  const saveEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await visitorApi.contact(email.trim());
      setConversation((c) => (c ? { ...c, hasEmail: true } : c));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong, please try again');
    }
  };

  const startOver = () => {
    setConversation(null);
    setSeenId(null);
    writeStored({ active: false, seenId: undefined });
    composer.current?.focus();
  };

  const askEmail = Boolean(
    conversation && !ended && !conversation.agentName && !conversation.hasEmail && !conversation.aiActive && !online,
  );
  const typing = waitingForAi && typingGaveUp !== lastMessageId;
  const status = conversation?.agentName
    ? `Chatting with ${conversation.agentName}`
    : conversation?.aiActive
      ? 'AI assistant · a team member can join'
      : online
        ? 'We are online'
        : 'We will reply as soon as we can';

  return (
    <div className='fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 font-site-body sm:right-6 sm:bottom-6'>
      {panelMounted ? (
        <div
          ref={panel}
          inert={!open}
          role='dialog'
          aria-label='Chat with our team'
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
          className='flex h-[min(620px,calc(100dvh-112px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-[18px] border border-[#2e343e] bg-[#1b1f26] text-[#f1f3f6] shadow-2xl'
        >
          <header data-chat-part className='flex items-center gap-3 border-b border-[#2e343e] px-4 py-3.5'>
            <span ref={avatar} className='relative grid size-10 shrink-0 place-items-center rounded-full bg-brand'>
              {conversation?.agentName ? (
                <span className='text-[16px] font-semibold'>{conversation.agentName[0]?.toUpperCase()}</span>
              ) : (
                <Headset className='size-5' aria-hidden />
              )}
              {online ? (
                <span
                  ref={onlineDot}
                  className='absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-[#1b1f26] bg-emerald-500'
                />
              ) : null}
            </span>
            <div className='min-w-0 flex-1'>
              <h2 className='font-site-heading text-[15px] font-semibold'>Chat with our team</h2>
              <p ref={statusLine} className='truncate text-[13px] text-white/60'>
                {status}
              </p>
            </div>
            <button
              type='button'
              onClick={close}
              aria-label='Close chat'
              className='grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-[#f1f3f6]'
            >
              <X className='size-5' aria-hidden />
            </button>
          </header>

          <div
            ref={log}
            data-chat-part
            role='log'
            aria-live='polite'
            data-lenis-prevent
            className='flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-4'
          >
            <p className='max-w-[85%] rounded-[14px] rounded-bl-[4px] bg-white/[0.08] px-3.5 py-2.5 text-[15px]'>
              Hi, how can we help?
            </p>
            {conversation?.messages.map((m) =>
              m.sender === 'system' ? (
                <p
                  key={m.id}
                  data-message-id={m.id}
                  data-sender={m.sender}
                  className='py-1 text-center text-[13px] text-white/55'
                >
                  {m.body}
                </p>
              ) : m.sender === 'ai' ? (
                <div key={m.id} className='flex max-w-[85%] flex-col gap-1'>
                  <span className='text-[12px] text-white/55'>{m.senderName || 'AI assistant'}</span>
                  <p
                    data-message-id={m.id}
                    data-sender={m.sender}
                    className='rounded-[14px] rounded-bl-[4px] bg-white/[0.08] px-3.5 py-2.5 text-[15px] break-words whitespace-pre-wrap'
                  >
                    {m.body}
                  </p>
                </div>
              ) : (
                <p
                  key={m.id}
                  data-message-id={m.id}
                  data-sender={m.sender}
                  className={
                    m.sender === 'visitor'
                      ? 'max-w-[85%] self-end rounded-[14px] rounded-br-[4px] bg-brand px-3.5 py-2.5 text-[15px] break-words whitespace-pre-wrap'
                      : 'max-w-[85%] rounded-[14px] rounded-bl-[4px] bg-white/[0.08] px-3.5 py-2.5 text-[15px] break-words whitespace-pre-wrap'
                  }
                >
                  {m.body}
                </p>
              ),
            )}
            {typing ? (
              <p role='status' className='text-[13px] text-white/55'>
                AI assistant is typing…
              </p>
            ) : null}
            {askEmail ? (
              <form onSubmit={saveEmail} className='mt-1 flex flex-col gap-2 rounded-[14px] border border-white/10 p-3'>
                <label htmlFor='support-email' className='text-[14px] text-white/80'>
                  Nobody is online right now. Leave your email and we will reply there.
                </label>
                <input
                  id='support-email'
                  type='email'
                  required
                  autoComplete='email'
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                  className={FIELD}
                />
                <button
                  type='submit'
                  className='min-h-11 cursor-pointer rounded-[10px] bg-white/[0.12] px-4 text-[14px] font-semibold hover:bg-white/20'
                >
                  Save email
                </button>
              </form>
            ) : null}
          </div>

          <div data-chat-part className='border-t border-[#2e343e] p-3'>
            {error ? (
              <p role='alert' className='mb-2 text-[13px] text-brand-soft'>
                {error}
              </p>
            ) : null}
            {ended ? (
              <button
                type='button'
                onClick={startOver}
                className='min-h-11 w-full cursor-pointer rounded-[10px] bg-brand px-4 text-[14px] font-semibold hover:bg-brand-hover'
              >
                Start a new chat
              </button>
            ) : (
              <div className='flex items-end gap-2'>
                <textarea
                  ref={composer}
                  rows={1}
                  value={draft}
                  maxLength={SUPPORT_MESSAGE_MAX}
                  aria-label='Your message'
                  placeholder='Write a message'
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  data-lenis-prevent
                  className={`${FIELD} max-h-28 min-h-11 resize-none`}
                />
                <button
                  type='button'
                  onClick={() => void send()}
                  disabled={sending || !draft.trim()}
                  aria-label='Send message'
                  className='grid size-11 shrink-0 cursor-pointer place-items-center rounded-[10px] bg-brand hover:bg-brand-hover disabled:cursor-default disabled:opacity-50'
                >
                  <SendHorizontal className='size-5' aria-hidden />
                </button>
              </div>
            )}
            {/* Off-screen for people; bots fill it in. */}
            <input
              tabIndex={-1}
              aria-hidden
              autoComplete='off'
              name='website'
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className='absolute -left-[9999px] size-px opacity-0'
            />
            <p className='mt-2 text-[12px] text-white/50'>
              This chat is kept for up to {retentionMonths} months so we can help you. See our{' '}
              <Link href='/privacy-policy' className='underline underline-offset-2 hover:text-[#f1f3f6]'>
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      <div className='flex items-end gap-3'>
        {!open && !hintHidden ? (
          <ChatHint
            online={online}
            skipEntrance={hintEntered}
            onEntered={() => setHintEntered(true)}
            onOpen={openPanel}
            onGone={() => setHintHidden(true)}
          />
        ) : null}
        <button
          ref={launcher}
          type='button'
          onClick={() => (open ? close() : openPanel())}
          aria-expanded={open}
          aria-label={
            open
              ? 'Close chat'
              : unread
                ? `Open chat, ${unread} new ${unread === 1 ? 'message' : 'messages'}`
                : 'Open chat'
          }
          className='relative grid size-16 cursor-pointer place-items-center rounded-full bg-brand text-[#f1f3f6] shadow-xl transition-colors hover:bg-brand-hover motion-reduce:transition-none'
        >
          <span ref={chatIcon} className='absolute inset-0 grid place-items-center'>
            <Headset className='size-7' aria-hidden />
          </span>
          <span ref={closeIcon} className='absolute inset-0 grid place-items-center opacity-0'>
            <X className='size-7' aria-hidden />
          </span>
          {unread > 0 ? (
            <span
              ref={badge}
              className='absolute -top-1 -left-1 grid h-6 min-w-6 place-items-center rounded-full bg-[#f1f3f6] px-1.5 text-[12px] font-bold text-[#1b1f26]'
            >
              {unread}
            </span>
          ) : online ? (
            <span className='absolute top-0.5 right-0.5 size-4 rounded-full border-2 border-[#1b1f26] bg-emerald-500' />
          ) : null}
        </button>
      </div>
    </div>
  );
}
