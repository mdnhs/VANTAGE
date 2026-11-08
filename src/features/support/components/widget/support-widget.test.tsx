// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportWidget } from './support-widget';
import { takeNewIds } from './use-chat-moments';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ success: true, data: { online: false } }))),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SupportWidget opening and closing', () => {
  const open = async () => {
    render(<SupportWidget retentionMonths={12} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Open chat' }));
    return screen.getByRole('dialog');
  };
  const launcher = () => screen.getAllByRole('button', { name: 'Close chat' }).at(-1)!;
  const preferReducedMotion = () =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));

  const letAnimationStart = () => new Promise((resolve) => setTimeout(resolve, 120));

  it('does not strand the panel when closed before the animation has begun', async () => {
    await open();

    fireEvent.click(launcher());

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps the panel on screen while it animates closed, then removes it', async () => {
    await open();
    await letAnimationStart();

    fireEvent.click(launcher());

    expect(screen.queryByRole('dialog')).not.toBeNull();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 3000 });
  });

  it('reports the closed state to assistive technology straight away', async () => {
    await open();

    const button = launcher();
    fireEvent.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('survives being reopened halfway through closing', async () => {
    await open();
    await letAnimationStart();
    fireEvent.click(launcher());

    fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
    await new Promise((resolve) => setTimeout(resolve, 900));

    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('removes the panel at once for people who prefer reduced motion', async () => {
    preferReducedMotion();
    await open();

    fireEvent.click(launcher());

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('SupportWidget privacy notice', () => {
  it('says how long the chat is kept', async () => {
    render(<SupportWidget retentionMonths={12} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Open chat' }));

    expect(screen.getByText(/kept for up to 12 months/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /privacy policy/i }).getAttribute('href')).toBe('/privacy-policy');
  });
});

describe('SupportWidget help offer', () => {
  const stubMedia = (...matching: string[]) =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: matching.some((m) => query.includes(m)),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));
  const flush = (ms = 10) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
  const offer = () => screen.getByRole('group', { name: 'Chat options' });
  const main = () => screen.getByRole('button', { name: 'How can we help?' });
  const option = (name: string) => screen.queryByRole('button', { name });
  const composer = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Your message' });
  const hoverOffer = () => fireEvent.pointerEnter(offer(), { pointerType: 'mouse' });

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    stubMedia('reduce');
    render(<SupportWidget retentionMonths={12} />);
    await flush();
  });
  afterEach(() => void vi.useRealTimers());

  it('keeps its options out of the way until it is hovered', () => {
    expect(option('Get a repair estimate')).toBeNull();

    hoverOffer();

    expect(option('Get a repair estimate')).not.toBeNull();
    expect(option('Help with an insurance claim')).not.toBeNull();
    expect(option('Ask something else')).not.toBeNull();
  });

  it('folds its options away shortly after the pointer leaves', async () => {
    hoverOffer();

    fireEvent.pointerLeave(offer(), { pointerType: 'mouse' });
    await flush(600);

    expect(option('Get a repair estimate')).toBeNull();
  });

  it('stays open if the pointer comes straight back', async () => {
    hoverOffer();
    fireEvent.pointerLeave(offer(), { pointerType: 'mouse' });

    hoverOffer();
    await flush(600);

    expect(option('Get a repair estimate')).not.toBeNull();
  });

  it('reveals its options to keyboard users on focus', () => {
    fireEvent.focus(main());

    expect(option('Get a repair estimate')).not.toBeNull();
  });

  it('starts the chat with a chosen topic written but not sent', () => {
    const fetchSpy = vi.mocked(fetch);
    hoverOffer();

    fireEvent.click(option('Get a repair estimate')!);

    expect(composer().value).toBe("I'd like a repair estimate.");
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('opens an empty chat for anything else', () => {
    hoverOffer();

    fireEvent.click(option('Ask something else')!);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(composer().value).toBe('');
  });

  it('shows its options when clicked, instead of opening the chat', () => {
    fireEvent.click(main());

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(option('Get a repair estimate')).not.toBeNull();
  });

  it('keeps its options showing when clicked while hovered', () => {
    hoverOffer();

    fireEvent.click(main());

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(option('Get a repair estimate')).not.toBeNull();
  });
});

describe('SupportWidget help offer on a touch screen', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce') || query.includes('hover: none'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));
    render(<SupportWidget retentionMonths={12} />);
    await act(async () => void (await vi.advanceTimersByTimeAsync(10)));
  });
  afterEach(() => void vi.useRealTimers());

  const main = () => screen.getByRole('button', { name: 'How can we help?' });

  it('is not opened by the focus a real tap causes just before its click', () => {
    fireEvent.pointerDown(main(), { pointerType: 'touch' });
    fireEvent.pointerUp(main(), { pointerType: 'touch' });
    fireEvent.focus(main());
    fireEvent.click(main());

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Get a repair estimate' })).not.toBeNull();
  });

  it('shows the options on the first tap and folds them on the second, never opening the chat', () => {
    fireEvent.click(main());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Get a repair estimate' })).not.toBeNull();

    fireEvent.click(main());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Get a repair estimate' })).toBeNull();
  });
});

describe('takeNewIds', () => {
  it('returns only ids it has not seen, and remembers them', () => {
    const known = new Set(['a']);
    expect(takeNewIds(known, ['a', 'b'])).toEqual(['b']);
    expect(takeNewIds(known, ['a', 'b'])).toEqual([]);
  });
});

describe('SupportWidget moments', () => {
  const chat = (agentName: string | null) => ({
    id: 'chat-1',
    status: 'open',
    agentName,
    hasEmail: true,
    messages: [{ id: 'm1', sender: 'visitor', senderName: null, body: 'Hello', createdAt: '2026-11-08T12:00:00.000Z' }],
  });
  const respondWith = (conversation: unknown) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const data = String(url).endsWith('/conversation') ? conversation : { online: false };
        return new Response(JSON.stringify({ success: true, data }));
      }),
    );
  const flush = (ms = 10) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
  const hint = () => screen.queryByRole('button', { name: 'How can we help?' });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal(
      'EventSource',
      class {
        addEventListener() {}
        close() {}
      },
    );
  });
  afterEach(() => void vi.useRealTimers());

  it('offers help as soon as the page has loaded', async () => {
    render(<SupportWidget retentionMonths={12} />);

    await flush();

    expect(hint()).not.toBeNull();
  });

  it('offers help to someone already in a chat too', async () => {
    localStorage.setItem('support-chat', JSON.stringify({ active: true }));
    respondWith(chat(null));
    render(<SupportWidget retentionMonths={12} />);

    await flush();

    expect(hint()).not.toBeNull();
  });

  it('offers help on a new visit even if it was dismissed on an earlier one', async () => {
    localStorage.setItem('support-chat', JSON.stringify({ hintHidden: true }));
    render(<SupportWidget retentionMonths={12} />);

    await flush();

    expect(hint()).not.toBeNull();
  });

  it('never leaves the offer invisible for people who prefer reduced motion', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));
    render(<SupportWidget retentionMonths={12} />);
    await flush();

    const lines = document.querySelectorAll<HTMLElement>('[data-hint-rise]');

    expect(lines.length).toBeGreaterThan(0);
    expect([...lines].every((line) => line.style.opacity === '' && line.style.transform === '')).toBe(true);
  });

  it('closes by shrinking to a circle at the spot that was clicked', async () => {
    render(<SupportWidget retentionMonths={12} />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Hide this message' }), { clientX: 40, clientY: 12, detail: 1 });

    const clip = screen.getByRole('group', { name: 'Chat options', hidden: true }).style.clipPath;
    expect(clip).toContain('circle(');
    expect(clip).toContain('at 40px 12px');
  });

  it('comes back on the next page load after being dismissed', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }));
    const firstLoad = render(<SupportWidget retentionMonths={12} />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Hide this message' }));
    expect(hint()).toBeNull();

    firstLoad.unmount();
    render(<SupportWidget retentionMonths={12} />);
    await flush();

    expect(hint()).not.toBeNull();
  });

  it('shows the agent in the header once one has joined', async () => {
    localStorage.setItem('support-chat', JSON.stringify({ active: true }));
    respondWith(chat('Sam'));
    render(<SupportWidget retentionMonths={12} />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));

    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByText('Chatting with Sam')).toBeTruthy();
  });
});
