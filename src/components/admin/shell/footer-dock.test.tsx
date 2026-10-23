import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { HELP_LINK, visibleNav } from '@/lib/admin/nav';

import { FooterDock } from './footer-dock';

const dockFor = (roles: Parameters<typeof visibleNav>[0]) => [
  ...visibleNav(roles).filter((item) => item.dock),
  HELP_LINK,
];

const render = (roles: Parameters<typeof visibleNav>[0], tone: 'card' | 'rail' = 'card') =>
  renderToStaticMarkup(
    <FooterDock
      tone={tone}
      links={dockFor(roles)}
      pathname='/dashboard'
      onNavigate={vi.fn()}
      onSignOut={vi.fn()}
      signingOut={false}
    />,
  );

describe('FooterDock', () => {
  it('shows Users & roles, Activity log, Help and Log out for an owner', () => {
    const html = render(['owner']);
    expect(html).toContain('aria-label="Users &amp; roles"');
    expect(html).toContain('aria-label="Activity log"');
    expect(html).toContain('aria-label="Help"');
    expect(html).toContain('aria-label="Log out"');
  });

  it('hides Users & roles and Activity log from a role without those permissions', () => {
    const roles = (['editor', 'author', 'marketer', 'intake', 'viewer'] as const).filter(
      (r) => dockFor([r]).length === 1,
    );
    expect(roles.length).toBeGreaterThan(0);
    const html = render([roles[0]!]);
    expect(html).not.toContain('Users &amp; roles');
    expect(html).not.toContain('Activity log');
    expect(html).toContain('aria-label="Help"');
    expect(html).toContain('aria-label="Log out"');
  });

  it('keeps every destination in the icon-rail tone', () => {
    const html = render(['owner'], 'rail');
    expect(html).toContain('aria-label="Help"');
    expect(html).toContain('aria-label="Log out"');
  });
});
