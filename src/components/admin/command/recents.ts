import { useSyncExternalStore } from 'react';

const KEY = 'vantage-admin-search-recents';
export const RECENTS_MAX = 6;
const EMPTY: string[] = [];

// Newest first, case-insensitive de-dupe, capped. Blank queries are ignored.
export function pushRecent(list: readonly string[], q: string, max = RECENTS_MAX): string[] {
  const value = q.trim().slice(0, 100);
  if (!value) return [...list];
  return [value, ...list.filter((x) => x.toLowerCase() !== value.toLowerCase())].slice(0, max);
}

// Every access is guarded: private windows, blocked site data and previews can throw or return junk.
function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string').slice(0, RECENTS_MAX) : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    if (list.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable: recents just live in memory for this session.
  }
}

const listeners = new Set<() => void>();
let cache: string[] | null = null;

export const recentsStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get() {
    return (cache ??= read());
  },
  set(next: string[]) {
    cache = next;
    write(next);
    listeners.forEach((fn) => fn());
  },
};

export function useRecents() {
  return useSyncExternalStore(recentsStore.subscribe, recentsStore.get, () => EMPTY);
}
