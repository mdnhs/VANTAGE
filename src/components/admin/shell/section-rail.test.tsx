import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ pathname: '/dashboard' }));

vi.mock('next/navigation', () => ({ usePathname: () => state.pathname }));
vi.mock('@/contexts/actor-provider', () => ({ useActor: () => ({ roles: ['owner'] }) }));

import { SectionRail } from './section-rail';

const render = () => renderToStaticMarkup(<SectionRail>content-here</SectionRail>);

describe('SectionRail', () => {
  beforeEach(() => {
    state.pathname = '/dashboard';
  });

  it('shows the Website children for a path under /dashboard/website/services', () => {
    state.pathname = '/dashboard/website/services/abc/edit';
    const html = render();
    expect(html).toContain('aria-label="Website"');
    expect(html).toContain('Home page');
    expect(html).toContain('Our work');
    expect(html).toMatch(
      /href="\/dashboard\/website\/services"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/dashboard\/website\/services"/,
    );
    expect(html).toContain('content-here');
  });

  it('pins the tabs on desktop without stretching them to the page height', () => {
    state.pathname = '/dashboard/website/process-page';
    const nav = render().match(/<nav[^>]*>/)?.[0] ?? '';
    expect(nav).toContain('lg:sticky');
    expect(nav).toContain('lg:top-0');
    expect(nav).toContain('lg:self-start');
  });

  it('renders no rail on /dashboard', () => {
    const html = render();
    expect(html).not.toContain('<nav');
    expect(html).toContain('content-here');
  });
});
