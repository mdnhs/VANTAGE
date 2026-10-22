// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseGlobal } from '@/lib/content/globals';

import { ContactForm } from './contact-form';
import { QuoteForm } from './quote-form';
import { StitchHeader } from './stitch-header';
import { fillCopy } from './ui/copy-template';

vi.mock('next/navigation', () => ({ usePathname: () => '/services' }));

afterEach(cleanup);

const header = (navigation = parseGlobal('navigation', {})) =>
  render(<StitchHeader navigation={navigation} phone='+353 1 234' businessName='Shop' logoPublicId={null} />);

describe('StitchHeader from navigation defaults', () => {
  it('renders the same desktop links, in order, as the old hard-coded bar', () => {
    header();
    const bar = screen.getByRole('navigation');
    const links = within(bar)
      .getAllByRole('link')
      .map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toEqual([
      ['Home', '/'],
      ['Services', '/services'],
      ['Our Work', '/our-work'],
      ['Insurance', '/insurance'],
      ['Contact', '/contact'],
    ]);
    expect(within(bar).getByText('Services').getAttribute('aria-current')).toBe('page');
  });

  it('keeps the CTA copy and href, with the short label below sm', () => {
    header();
    const cta = screen.getByRole('link', { name: /Free Quote/ });
    expect(cta.getAttribute('href')).toBe('/#estimator');
    expect(cta.textContent).toBe('Get a Free QuoteFree Quote');
    expect(cta.querySelector('.hidden.sm\\:inline')?.textContent).toBe('Get a Free Quote');
    expect(cta.querySelector('.sm\\:hidden')?.textContent).toBe('Free Quote');
  });

  it('lists mobile-only links in the mobile menu, then the wide quote button', () => {
    header();
    fireEvent.click(screen.getByLabelText('Toggle navigation menu'));
    const labels = screen.getAllByRole('navigation').map((n) =>
      within(n)
        .getAllByRole('link')
        .map((a) => a.textContent),
    );
    expect(labels[1]!.slice(0, 7)).toEqual([
      'Home',
      'Services',
      'Our Work',
      'Insurance',
      'Contact',
      'About',
      'Process',
    ]);
    const wide = screen.getByRole('link', { name: /Request Free Quote Online/ });
    expect(wide.getAttribute('href')).toBe('/get-a-quote');
  });

  it('follows edited navigation', () => {
    header(
      parseGlobal('navigation', {
        links: [{ label: 'Start', href: '/' }],
        cta: { label: 'Book now', href: '/book', shortLabel: 'Book' },
      }),
    );
    expect(screen.getByRole('link', { name: 'Start' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Services' })).toBeNull();
    expect(screen.getByRole('link', { name: /Book now/ }).getAttribute('href')).toBe('/book');
  });
});

describe('forms from default copy', () => {
  it('quote form shows the original step-1 copy', () => {
    render(<QuoteForm services={[]} copy={parseGlobal('quoteForm', {})} />);
    for (const text of [
      'Vehicle & Service',
      'Irish Registration Number',
      'Vehicle Make',
      'Primary Service Required',
      'Continue to damage details',
      'Helps us match OEM parts & paint code',
      'Average response time: 48 minutes',
      'No card required',
      'No-obligation & 100% free',
      'Privacy guarantee: your registration and contact details are used only for your quote.',
    ]) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(screen.getByPlaceholderText('e.g. 231-D-48912')).toBeTruthy();
  });

  it('contact form shows the original copy', () => {
    render(<ContactForm services={[]} copy={parseGlobal('contactForm', {})} />);
    for (const text of ['Send an enquiry', /^First Name/, 'Service Required', 'Submit enquiry']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('We aim to respond to all enquiries within 24 hours.')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Select a service...' })).toBeTruthy();
  });
});

describe('fillCopy', () => {
  it('fills placeholders with emphasis and leaves unknown ones alone', () => {
    const { container } = render(<p>{fillCopy('Hi {name}, {nope} at {phone}.', { name: 'Ann', phone: '1' })}</p>);
    expect(container.textContent).toBe('Hi Ann, {nope} at 1.');
    expect(container.querySelectorAll('strong')).toHaveLength(2);
  });
});
