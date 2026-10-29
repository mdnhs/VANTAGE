import { flushSync } from 'react-dom';

// Where the last switch was triggered from. A pointer press records its spot; a key press clears
// it, so a keyboard switch (menu, ⌘K) reveals from the centre instead of a stale click.
let origin: { x: number; y: number } | null = null;

if (typeof window !== 'undefined') {
  const opts = { capture: true, passive: true } as const;
  window.addEventListener('pointerdown', (e) => (origin = { x: e.clientX, y: e.clientY }), opts);
  window.addEventListener('keydown', () => (origin = null), opts);
}

// True while a reveal runs. Chrome sends every press during a view transition to the root
// element, so an open menu would read it as a press outside and close (see user-menu.tsx).
let switching: ViewTransition | null = null;
export const isThemeSwitching = () => switching !== null;

const resolves = (theme: string) =>
  theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

// Circular reveal of the new theme from the trigger point via the View Transitions API (the
// OpsDesk theme switch). Falls back to an instant switch when unsupported, with reduced motion,
// or when the visible theme does not change (e.g. picking System while it already matches).
export function switchTheme(setTheme: (theme: string) => void, theme: string) {
  if (
    typeof document === 'undefined' ||
    !document.startViewTransition ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    setTheme(theme);
    return;
  }
  const root = document.documentElement;
  const next = resolves(theme);
  if (root.classList.contains('dark') === (next === 'dark')) {
    setTheme(theme);
    return;
  }
  const apply = () => {
    flushSync(() => setTheme(theme));
    // next-themes applies the class in an effect; set it here so the new snapshot is final.
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
  };

  const { x, y } = origin ?? { x: innerWidth / 2, y: innerHeight / 2 };
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = document.startViewTransition(apply);
  // A switch started mid-reveal skips the running one; only the latest clears the flag.
  switching = transition;
  transition.finished.finally(() => {
    if (switching === transition) switching = null;
  });
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`], opacity: [0.9, 1] },
      { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
    );
  });
}
