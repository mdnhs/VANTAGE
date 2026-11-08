'use client';

import { gsap } from 'gsap';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function takeNewIds(known: Set<string>, ids: string[]): string[] {
  const fresh = ids.filter((id) => !known.has(id));
  for (const id of fresh) known.add(id);
  return fresh;
}

function animateMessage(element: HTMLElement, delay: number) {
  if (element.dataset.sender === 'system') {
    gsap.fromTo(element, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, delay, clearProps: 'all' });
    return;
  }
  // The visitor's own message rises from the box they typed it in; a reply slides in from its side.
  const mine = element.dataset.sender === 'visitor';
  gsap.fromTo(
    element,
    {
      opacity: 0,
      x: mine ? 0 : -12,
      y: mine ? 44 : 16,
      scale: mine ? 0.82 : 0.92,
      transformOrigin: mine ? '100% 100%' : '0% 100%',
    },
    { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.44, delay, ease: 'back.out(1.5)', clearProps: 'all' },
  );
}

type Moments = {
  open: boolean;
  panelMounted: boolean;
  messageIds: string[];
  unread: number;
  agentName: string | null;
  online: boolean;
  launcher: RefObject<HTMLButtonElement | null>;
  log: RefObject<HTMLDivElement | null>;
};

// The small events of a chat, each animated only when it actually happens. Everything starts from
// its finished look and is only animated from a `fromTo`, so with reduced motion nothing is hidden.
export function useChatMoments({ open, panelMounted, messageIds, unread, agentName, online, launcher, log }: Moments) {
  const badge = useRef<HTMLSpanElement>(null);
  const avatar = useRef<HTMLSpanElement>(null);
  const statusLine = useRef<HTMLParagraphElement>(null);
  const onlineDot = useRef<HTMLSpanElement>(null);

  const knownMessages = useRef(new Set<string>());
  const previousUnread = useRef(0);
  const previousAgent = useRef<string | null>(null);

  // Messages already there when the panel opens are part of its opening; only arrivals animate.
  const messageKey = messageIds.join(',');
  const visible = open && panelMounted;
  useLayoutEffect(() => {
    const fresh = takeNewIds(knownMessages.current, messageKey.split(',').filter(Boolean));
    if (!visible || !log.current || reducedMotion()) return;
    fresh.forEach((id, index) => {
      const element = log.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
      if (element) animateMessage(element, index * 0.07);
    });
  }, [messageKey, visible, log]);

  useLayoutEffect(() => {
    const rose = unread > previousUnread.current;
    previousUnread.current = unread;
    if (!rose || !launcher.current || reducedMotion()) return;
    gsap.to(launcher.current, { keyframes: { rotate: [0, -14, 11, -7, 4, 0] }, duration: 0.6, ease: 'power1.inOut' });
    if (badge.current) gsap.fromTo(badge.current, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
  }, [unread, launcher]);

  useLayoutEffect(() => {
    const joined = agentName !== null && agentName !== previousAgent.current;
    previousAgent.current = agentName;
    if (!joined || !visible || reducedMotion()) return;
    gsap.fromTo(
      avatar.current,
      { scale: 0.3, rotate: -25 },
      { scale: 1, rotate: 0, duration: 0.55, ease: 'back.out(2.2)' },
    );
    gsap.fromTo(statusLine.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, [agentName, visible]);

  useEffect(() => {
    if (!panelMounted || !online || !onlineDot.current || reducedMotion()) return;
    const pulse = gsap.to(onlineDot.current, {
      scale: 1.35,
      duration: 1.1,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
    return () => void pulse.kill();
  }, [panelMounted, online]);

  return { badge, avatar, statusLine, onlineDot };
}
