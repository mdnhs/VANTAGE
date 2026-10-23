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

  it('shows the Website children for a path under /dashboard/services', () => {
    state.pathname = '/dashboard/services/abc/edit';
    const html = render();
    expect(html).toContain('aria-label="Website"');
    expect(html).toContain('Home page');
    expect(html).toContain('Our work');
    expect(html).toMatch(
      /href="\/dashboard\/services"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/dashboard\/services"/,
    );
    expect(html).toContain('content-here');
  });

  it('renders no rail on /dashboard', () => {
    const html = render();
    expect(html).not.toContain('<nav');
    expect(html).toContain('content-here');
  });
});
