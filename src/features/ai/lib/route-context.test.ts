import { describe, expect, it } from 'vitest';

import { ChatContext } from '@/lib/ai/schema';

import { contextFromRoute } from './route-context';
import { STARTERS } from './starters';

describe('contextFromRoute (V9-R10)', () => {
  it('maps the exact editor paths to their page keys', () => {
    const paths: Record<string, string> = {
      '/dashboard/home-page': 'page.home',
      '/dashboard/services': 'page.services',
      '/dashboard/projects': 'page.our-work',
      '/dashboard/insurance': 'page.insurance',
      '/dashboard/about': 'page.about',
      '/dashboard/process-page': 'page.process',
    };
    for (const [path, key] of Object.entries(paths)) {
      expect(contextFromRoute(path)).toEqual({ screen: 'page', context: { path, entity: { type: 'page', key } } });
    }
    expect(contextFromRoute('/dashboard/about/')?.screen).toBe('page');
  });

  it('keeps sub-routes and other screens on the default set', () => {
    expect(contextFromRoute('/dashboard/about/x')).toEqual({
      screen: 'default',
      context: { path: '/dashboard/about/x' },
    });
    expect(contextFromRoute('/dashboard')).toEqual({ screen: 'default', context: { path: '/dashboard' } });
    expect(contextFromRoute('/dashboard/projects/new')?.screen).toBe('default');
  });

  it('uses the enquiries set for quotes and contacts', () => {
    expect(contextFromRoute('/dashboard/quotes')).toEqual({
      screen: 'enquiries',
      context: { path: '/dashboard/quotes' },
    });
    expect(contextFromRoute('/dashboard/contacts')?.screen).toBe('enquiries');
  });

  it('sends nothing outside the dashboard', () => {
    expect(contextFromRoute('/login')).toBeNull();
    expect(contextFromRoute('/dashboardx')).toBeNull();
    expect(contextFromRoute('/')).toBeNull();
  });

  it('only produces contexts the server accepts, with the path capped at 200', () => {
    expect(ChatContext.safeParse(contextFromRoute('/dashboard/about')!.context).success).toBe(true);
    const long = `/dashboard/${'x'.repeat(300)}`;
    expect(contextFromRoute(long)!.context.path).toHaveLength(200);
  });

  it('sends no context for a path the server would refuse', () => {
    expect(contextFromRoute('/dashboard/a b')).toBeNull();
    expect(contextFromRoute('/dashboard/quote?x=1')).toBeNull();
  });

  it('has four starters for every screen', () => {
    for (const screen of ['default', 'page', 'enquiries'] as const) expect(STARTERS[screen]).toHaveLength(4);
  });
});
