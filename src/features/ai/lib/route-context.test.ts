import { describe, expect, it } from 'vitest';

import { ChatContext } from '@/lib/ai/schema';

import { contextFromRoute } from './route-context';
import { STARTERS } from './starters';

describe('contextFromRoute (V9-R10)', () => {
  it('maps the exact editor paths to their page keys', () => {
    const paths: Record<string, string> = {
      '/dashboard/website/home-page': 'page.home',
      '/dashboard/website/services': 'page.services',
      '/dashboard/website/projects': 'page.our-work',
      '/dashboard/website/insurance': 'page.insurance',
      '/dashboard/website/about': 'page.about',
      '/dashboard/website/process-page': 'page.process',
      '/dashboard/website/contact-page': 'page.contact',
    };
    for (const [path, key] of Object.entries(paths)) {
      expect(contextFromRoute(path)).toEqual({ screen: 'page', context: { path, entity: { type: 'page', key } } });
    }
    expect(contextFromRoute('/dashboard/website/about/')?.screen).toBe('page');
  });

  it('keeps sub-routes and other screens on the default set', () => {
    expect(contextFromRoute('/dashboard/website/about/x')).toEqual({
      screen: 'default',
      context: { path: '/dashboard/website/about/x' },
    });
    expect(contextFromRoute('/dashboard')).toEqual({ screen: 'default', context: { path: '/dashboard' } });
    expect(contextFromRoute('/dashboard/website/projects/new')?.screen).toBe('default');
  });

  it('uses the enquiries set for quotes and contacts', () => {
    expect(contextFromRoute('/dashboard/enquiries/quotes')).toEqual({
      screen: 'enquiries',
      context: { path: '/dashboard/enquiries/quotes' },
    });
    expect(contextFromRoute('/dashboard/enquiries/contacts')?.screen).toBe('enquiries');
  });

  it('sends nothing outside the dashboard', () => {
    expect(contextFromRoute('/login')).toBeNull();
    expect(contextFromRoute('/dashboardx')).toBeNull();
    expect(contextFromRoute('/')).toBeNull();
  });

  it('only produces contexts the server accepts, with the path capped at 200', () => {
    expect(ChatContext.safeParse(contextFromRoute('/dashboard/website/about')!.context).success).toBe(true);
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
