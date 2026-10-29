'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowUpRightIcon, HistoryIcon, SearchIcon, SparklesIcon, XIcon } from 'lucide-react';
import { animate, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { useActor } from '@/contexts/actor-provider';
import { useSignOut } from '@/features/auth/hooks/use-sign-out';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';

import { buildActions, matchesQuery, type PaletteAction } from './actions';
import { useCommandPalette } from './palette-context';
import { pushRecent, recentsStore, useRecents } from './recents';

type SearchHit = { id: string; kind: 'page'; label: string; href: string };

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}`;

async function fetchSearch(q: string): Promise<SearchHit[]> {
  const res = await fetch(`${BASE_URL}/admin/search?q=${encodeURIComponent(q)}`);
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body?.error?.message ?? 'Search failed');
  return body.data.items as SearchHit[];
}

// Chips that fill the query. The server still filters what each role may reach.
const POPULAR = ['Enquiries', 'Services', 'Our work', 'SEO', 'Media', 'Appearance'] as const;

// Surface morph (pill → panel). Near-critical damping so the corner radius never overshoots; interruptible.
const MORPH = { type: 'spring' as const, stiffness: 320, damping: 36, mass: 0.9 };
const ACTIVE = { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] as const };
const RADIUS = 16;

// One navigable row in the panel: a page, an action, a recent or a popular chip.
type Opt =
  | { id: string; kind: 'href'; href: string }
  | { id: string; kind: 'action'; action: PaletteAction }
  | { id: string; kind: 'fill'; fill: string };

const optId = (id: string) => `admin-search-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
const subscribe = () => () => {};
const isApple = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// The topbar search (the OpsDesk global search): ONE surface. Closed it is the pill; open, a spring
// grows its clip-path into the panel below, where quick actions, recent and popular searches wait
// until the user types. Focus never leaves the input; ↑↓ move the highlight, Enter picks it.
export function GlobalSearch({ siteUrl }: { siteUrl: string }) {
  const { open, setOpen } = useCommandPalette();
  const apple = useSyncExternalStore(subscribe, isApple, () => true);
  const router = useRouter();
  const { user } = useActor();
  const { setTheme } = useTheme();
  const { signOut } = useSignOut();
  const recents = useRecents();

  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  // Keeps the sections mounted while the surface collapses back into the pill.
  const [closing, setClosing] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    setClosing(!open && !reducedMotion());
    if (open) setActive(0);
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Morph progress (0 = pill, 1 = panel), kept across interruptions.
  const morph = useRef(0);

  const term = useDebouncedValue(q.trim(), 150);
  const searching = q.trim() !== '';
  const { data: hits, isError } = useQuery({
    queryKey: ['admin-search', user.id, term],
    queryFn: () => fetchSearch(term),
    enabled: open && term !== '',
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const actions = useMemo(() => buildActions({ setTheme, signOut, siteUrl }), [setTheme, signOut, siteUrl]);
  const matched = useMemo(
    () => actions.filter((action) => matchesQuery(q, action.label, action.keywords)),
    [actions, q],
  );

  // Flat, ordered list of the options on screen, in render order.
  const opts: Opt[] = useMemo(() => {
    const acts = (list: PaletteAction[]) =>
      list.map((action) => ({ id: `a-${action.id}`, kind: 'action' as const, action }));
    if (searching) {
      return [
        ...(term ? (hits ?? []) : []).map((hit) => ({ id: `r-${hit.id}`, kind: 'href' as const, href: hit.href })),
        ...acts(matched),
      ];
    }
    return [
      ...acts(actions),
      ...recents.map((r) => ({ id: `h-${r}`, kind: 'fill' as const, fill: r })),
      ...POPULAR.map((p) => ({ id: `p-${p}`, kind: 'fill' as const, fill: p })),
    ];
  }, [searching, term, hits, matched, actions, recents]);
  const cur = Math.min(active, Math.max(0, opts.length - 1));
  const activeId = open && opts[cur] ? optId(opts[cur].id) : undefined;

  const close = () => setOpen(false);

  const pick = (o: Opt) => {
    if (o.kind === 'fill') {
      setQ(o.fill);
      setActive(0);
      inputRef.current?.focus();
      return;
    }
    recentsStore.set(pushRecent(recentsStore.get(), q));
    close();
    setQ('');
    inputRef.current?.blur();
    if (o.kind === 'href') router.push(o.href);
    else o.action.run();
  };

  // ⌘K (palette context) opens it from anywhere: hand focus to the input.
  useEffect(() => {
    if (open && document.activeElement !== inputRef.current) inputRef.current?.focus();
  }, [open]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, setOpen]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  // Morph on ONE surface with clip-path only. Open: the layer takes its final panel width at once
  // and the clip starts at exactly the pill, then springs to the panel. Close: the sections fade,
  // the clip springs back to the pill, then the layer returns to pill width (visually identical).
  // Each animate() starts from the current progress, so it is interruptible.
  useLayoutEffect(() => {
    const layer = layerRef.current;
    const el = surfaceRef.current;
    const root = rootRef.current;
    if (!layer || !el || !root || (!open && !closing)) return;
    const box = root.getBoundingClientRect();
    const narrow = matchMedia('(max-width: 640px)').matches;
    const panelW = narrow ? box.width : Math.round(Math.max(box.width, Math.min(640, innerWidth - box.left - 12)));
    if (open) layer.style.width = `${panelW}px`;
    if (reducedMotion()) return;
    // At 1 the clip is removed: the surface's own radius matches, so that frame is identical.
    const apply = (t: number) => {
      if (t >= 1) {
        el.style.clipPath = '';
        return;
      }
      const right = (layer.offsetWidth - box.width) * (1 - t);
      const bottom = Math.max(0, el.offsetHeight - box.height) * (1 - t);
      const round = box.height / 2 + (RADIUS - box.height / 2) * t;
      el.style.clipPath = `inset(0px ${right}px ${bottom}px 0px round ${round}px)`;
    };
    let live = true;
    if (open && morph.current === 0) apply(0);
    const run = animate(morph.current, open ? 1 : 0, {
      ...MORPH,
      delay: open ? 0 : 0.06,
      onUpdate: (t) => {
        morph.current = t;
        apply(t);
      },
    });
    run.then(() => {
      if (!live) return;
      if (open) return apply(1);
      morph.current = 0;
      layer.style.width = '';
      el.style.clipPath = '';
      setClosing(false);
    });
    return () => {
      live = false;
      run.stop();
    };
  }, [open, closing]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    const move = (to: number) => {
      e.preventDefault();
      if (!open) setOpen(true);
      if (opts.length) setActive((to + opts.length) % opts.length);
    };
    switch (e.key) {
      case 'ArrowDown':
        return move(open ? cur + 1 : cur);
      case 'ArrowUp':
        return move(cur - 1);
      case 'Enter':
        if (open && opts[cur]) {
          e.preventDefault();
          pick(opts[cur]);
        }
        return;
      case 'Escape':
        e.preventDefault();
        if (q) {
          setQ('');
          setActive(0);
        } else if (open) {
          close();
          inputRef.current?.blur();
        }
        return;
      case 'Tab':
        if (open) close();
        return;
    }
  };

  let index = 0;
  // Props for the option rendered next; the order matches `opts`. Pointer handling is delegated
  // to the listbox (data-index), so options carry no handlers.
  const option = () => {
    const i = index++;
    return {
      i,
      props: {
        id: optId(opts[i]!.id),
        role: 'option' as const,
        'aria-selected': i === cur,
        'data-active': i === cur ? '' : undefined,
        'data-index': i,
        tabIndex: -1,
      },
    };
  };
  const indexOf = (target: EventTarget) => {
    const el = (target as Element).closest<HTMLElement>('[data-index]');
    return el ? Number(el.dataset.index) : -1;
  };
  const highlight = (i: number) =>
    i === cur ? (
      <motion.span
        layoutId='admin-search-active'
        aria-hidden
        className='absolute inset-0 -z-10 rounded-lg bg-accent'
        transition={ACTIVE}
      />
    ) : null;

  const ROW =
    'relative isolate flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground outline-none data-active:text-foreground [&_svg]:size-4 [&_svg]:shrink-0';
  const HEAD =
    'flex items-center gap-2 px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase';
  const section = (n: number) => ({
    className: 'flex flex-col motion-safe:animate-[admin-search-in_220ms_cubic-bezier(.2,.8,.2,1)_both]',
    style: { animationDelay: `${110 + n * 30}ms` },
  });

  const state = open ? 'open' : closing ? 'closing' : 'closed';
  const showPanel = open || closing;

  return (
    <div ref={rootRef} className='relative z-40 h-11 w-full max-w-sm min-w-0'>
      <div ref={layerRef} data-state={state} className='group/search absolute top-0 left-0 w-full'>
        {/* Shadow on a sibling behind the clipped surface (clip-path would cut it off). */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-xl shadow-black/10 transition-opacity duration-150 group-data-[state=open]/search:opacity-100 group-data-[state=open]/search:delay-150 group-data-[state=open]/search:duration-300'
        />
        <div
          ref={surfaceRef}
          className='relative flex flex-col overflow-hidden rounded-full border border-border bg-card text-foreground group-data-[state=closing]/search:rounded-2xl group-data-[state=open]/search:rounded-2xl group-data-[state=closed]/search:hover:border-ring/40'
        >
          <div className='flex h-[42px] shrink-0 items-center gap-3 px-4 text-muted-foreground'>
            <SearchIcon aria-hidden className='size-4 shrink-0' />
            <input
              ref={inputRef}
              type='search'
              role='combobox'
              aria-label='Search'
              aria-expanded={open}
              aria-controls='admin-search-list'
              aria-autocomplete='list'
              aria-activedescendant={activeId}
              aria-keyshortcuts='Meta+K Control+K'
              autoComplete='off'
              placeholder={open ? 'Search pages and actions…' : 'Search'}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
                if (!open) setOpen(true);
              }}
              onFocus={() => !open && setOpen(true)}
              onKeyDown={onKeyDown}
              className='h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden'
            />
            {q ? (
              <button
                type='button'
                aria-label='Clear search'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQ('');
                  setActive(0);
                }}
                className='grid size-6 shrink-0 place-items-center rounded-full hover:bg-muted hover:text-foreground'
              >
                <XIcon aria-hidden className='size-3.5' />
              </button>
            ) : !open ? (
              <KbdGroup aria-hidden className='hidden sm:inline-flex'>
                <Kbd>{apple ? '⌘' : 'Ctrl'}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            ) : null}
          </div>

          {showPanel ? (
            <div className='flex min-h-0 flex-col px-2 pb-2 transition-opacity duration-150 group-data-[state=closing]/search:pointer-events-none group-data-[state=closing]/search:opacity-0'>
              <div
                id='admin-search-list'
                role='listbox'
                aria-label={searching ? 'Search results' : 'Suggestions'}
                // Keep focus in the input.
                onMouseDown={(e) => e.preventDefault()}
                onPointerMove={(e) => {
                  const i = indexOf(e.target);
                  if (i >= 0 && i !== cur) setActive(i);
                }}
                onClick={(e) => {
                  const i = indexOf(e.target);
                  if (opts[i]) pick(opts[i]);
                }}
                className='flex max-h-[min(460px,62vh)] flex-col gap-1 overflow-y-auto overscroll-contain border-t border-border pt-1'
              >
                {searching ? (
                  <>
                    {hits?.length && term ? (
                      <div role='group' aria-label='Go to' {...section(0)}>
                        <div className={HEAD}>Go to</div>
                        {hits.map((hit) => {
                          const { i, props } = option();
                          return (
                            <div key={hit.id} {...props} className={ROW}>
                              {highlight(i)}
                              <ArrowUpRightIcon aria-hidden />
                              <span className='truncate'>{hit.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {matched.length ? (
                      <div role='group' aria-label='Actions' {...section(1)}>
                        <div className={HEAD}>Actions</div>
                        {matched.map((action) => {
                          const { i, props } = option();
                          return (
                            <div key={action.id} {...props} className={ROW}>
                              {highlight(i)}
                              <SparklesIcon aria-hidden />
                              <span className='truncate'>{action.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {opts.length === 0 ? (
                      <p role='presentation' className='px-3 py-6 text-center text-sm text-muted-foreground'>
                        {isError
                          ? 'Search is unavailable right now. Try again in a moment.'
                          : hits && term === q.trim()
                            ? `Nothing matches “${q.trim()}”.`
                            : 'Searching…'}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div role='group' aria-label='Quick actions' {...section(0)}>
                      <div className={HEAD}>Quick actions</div>
                      {actions.map((action) => {
                        const { i, props } = option();
                        return (
                          <div key={action.id} {...props} className={ROW}>
                            {highlight(i)}
                            <SparklesIcon aria-hidden />
                            <span className='truncate'>{action.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {recents.length ? (
                      <div role='group' aria-label='Recent searches' {...section(1)}>
                        <div className={HEAD}>
                          Recent searches
                          <button
                            type='button'
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => recentsStore.set([])}
                            className='ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-normal normal-case hover:bg-muted hover:text-foreground'
                          >
                            Clear
                          </button>
                        </div>
                        {recents.map((r) => {
                          const { i, props } = option();
                          return (
                            <div key={r} {...props} className={cn(ROW, 'group/recent pr-1')}>
                              {highlight(i)}
                              <HistoryIcon aria-hidden />
                              <span className='flex-1 truncate'>{r}</span>
                              <button
                                type='button'
                                tabIndex={-1}
                                aria-label={`Remove “${r}” from recent searches`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  recentsStore.set(recentsStore.get().filter((x) => x !== r));
                                }}
                                className='grid size-6 place-items-center rounded-full opacity-0 group-hover/recent:opacity-100 group-data-active/recent:opacity-100 hover:bg-muted hover:text-foreground'
                              >
                                <XIcon aria-hidden className='size-3.5!' />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <div role='group' aria-label='Popular searches' {...section(2)}>
                      <div className={HEAD}>Popular searches</div>
                      <div className='flex flex-wrap gap-2 px-3 pt-1 pb-2'>
                        {POPULAR.map((p) => {
                          const { props } = option();
                          return (
                            <div
                              key={p}
                              {...props}
                              className='cursor-pointer rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors outline-none data-active:bg-primary data-active:text-primary-foreground'
                            >
                              {p}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
