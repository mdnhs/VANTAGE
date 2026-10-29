// @vitest-environment happy-dom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PUBLIC_PAGES } from '@/lib/seo/public-pages';

import { PageHero } from './landing-primitives';

afterEach(cleanup);

const crumbs = () => within(screen.getByRole('navigation', { name: 'breadcrumb' }));

describe('PageHero breadcrumb', () => {
  it('ends on the page itself: Home › page', () => {
    render(<PageHero page='services' eyebrow='e' lines={['Title']} />);
    expect(crumbs().getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
    // BreadcrumbPage carries role="link" (aria-disabled), so check for a real anchor instead.
    expect(crumbs().getByText(PUBLIC_PAGES.services.crumb).closest('a')).toBeNull();
    expect(crumbs().getByText(PUBLIC_PAGES.services.crumb).getAttribute('aria-current')).toBe('page');
  });

  it('links the page and ends on the child: Home › page › current', () => {
    render(<PageHero page='services' current='Crash Repair' eyebrow='e' lines={['Crash Repair']} />);
    expect(crumbs().getByRole('link', { name: PUBLIC_PAGES.services.crumb }).getAttribute('href')).toBe('/services');
    expect(crumbs().getByText('Crash Repair').getAttribute('aria-current')).toBe('page');
  });

  it('renders no breadcrumb without a page', () => {
    render(<PageHero eyebrow='e' lines={['Title']} />);
    expect(screen.queryByRole('navigation', { name: 'breadcrumb' })).toBeNull();
  });
});
