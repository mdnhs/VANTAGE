'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { CHAT_PATH, type ChatContext, type PageKey } from '@/lib/ai/schema';
import { GLOBAL_LABELS } from '@/lib/content/global-access';

export type AssistantScreen = 'page' | 'enquiries' | 'default';
export type RouteContext = { screen: AssistantScreen; context: ChatContext };

// The editable website pages and the exact admin paths that open them.
const PAGE_ROUTES: Record<string, PageKey> = {
  '/dashboard/home-page': 'page.home',
  '/dashboard/services': 'page.services',
  '/dashboard/projects': 'page.our-work',
  '/dashboard/insurance': 'page.insurance',
  '/dashboard/about': 'page.about',
  '/dashboard/process-page': 'page.process',
};

// From the route alone (no DOM): which screen the person is on and, on a page
// editor, its key. Exact paths only, so sub-routes stay "default". Only this ever
// leaves the browser.
export function contextFromRoute(pathname: string): RouteContext | null {
  if (!/^\/dashboard(\/|$)/.test(pathname)) return null;
  const path = pathname.slice(0, 200);
  // Anything the server would refuse as context is simply not sent.
  if (!CHAT_PATH.test(path)) return null;
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const key = PAGE_ROUTES[clean];
  if (key) return { screen: 'page', context: { path, entity: { type: 'page', key } } };
  if (clean === '/dashboard/quotes' || clean === '/dashboard/contacts') {
    return { screen: 'enquiries', context: { path } };
  }
  return { screen: 'default', context: { path } };
}

export function useRouteContext(): RouteContext | null {
  const pathname = usePathname();
  return useMemo(() => contextFromRoute(pathname ?? ''), [pathname]);
}

// The name shown on the "Using:" chip: the page's own label, no fetch.
export function useContextTitle(route: RouteContext | null): string | null {
  const entity = route?.context.entity;
  return entity ? GLOBAL_LABELS[entity.key] : null;
}
