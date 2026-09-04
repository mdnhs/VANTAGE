'use client';

import { Observer } from 'tailwindcss-intersect';
import { useEffect, type ReactNode } from 'react';

export default function IntersectObserverProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Deferred to a macrotask: this provider wraps the whole app, so its effect
    // can fire while deeper sections are still mid-hydration (streaming/selective
    // hydration). Observer.start() mutates the DOM (adds `no-intersect`) directly —
    // if that happens before a subtree finishes hydrating, React diffs the already
    // -mutated DOM against the SSR markup and bails on that subtree.
    const id = setTimeout(() => Observer.start(), 500);
    return () => clearTimeout(id);
  }, []);

  return <>{children}</>;
}
