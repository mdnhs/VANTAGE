// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cldUrl } from '@/lib/cloudinary/url';
import { parseGlobal } from '@/lib/content/globals';
import type { PublicImage } from '@/lib/media/public-image';

import { submitContactMessage } from '@/features/contact-messages/services/api';
import { submitQuoteRequest } from '@/features/quote-requests/services/api';

import { ContactForm } from './contact-form';
import { QuoteForm } from './quote-form';
import { StitchEstimator } from './stitch-estimator';
import { StitchHeader } from './stitch-header';
import { fillCopy } from './ui/copy-template';

vi.mock('next/navigation', () => ({ usePathname: () => '/services' }));
vi.mock('@/features/contact-messages/services/api', () => ({ submitContactMessage: vi.fn() }));
vi.mock('@/features/quote-requests/services/api', () => ({ submitQuoteRequest: vi.fn() }));

afterEach(cleanup);

const header = (navigation = parseGlobal('navigation', {})) =>
  render(<StitchHeader navigation={navigation} phone='+353 1 234' businessName='Shop' logo={null} />);

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

  it('sizes a legacy Cloudinary logo exactly as the old cldUrl did', () => {
    const logo: PublicImage = {
      id: null,
      src: cldUrl('vantage/logo'),
      mimeType: null,
      width: null,
      height: null,
      alt: '',
      blurDataUrl: null,
      focal: { x: 0.5, y: 0.5 },
    };
    render(
      <StitchHeader navigation={parseGlobal('navigation', {})} phone='+353 1 234' businessName='Shop' logo={logo} />,
    );
    const img = screen.getAllByAltText('Shop')[0]!;
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(cldUrl('vantage/logo', { height: 240 }));
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

describe('generate_lead from the contact form', () => {
  const fill = () => {
    render(<ContactForm services={[]} copy={parseGlobal('contactForm', {})} />);
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: 'Pat' } });
    fireEvent.change(screen.getByLabelText(/Last Name/), { target: { value: 'Quinn' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'pat@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '0871234567' } });
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Hello there' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit enquiry' }));
  };

  beforeEach(() => {
    vi.mocked(submitContactMessage).mockReset();
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
  });

  it('pushes generate_lead with the same event id it posted', async () => {
    vi.mocked(submitContactMessage).mockResolvedValue({} as never);
    fill();
    await waitFor(() => expect(submitContactMessage).toHaveBeenCalledTimes(1));
    const posted = vi.mocked(submitContactMessage).mock.calls[0]![0];
    expect(posted.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(posted.sourcePath).toBe(window.location.pathname);
    await waitFor(() => {
      const lead = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer.find(
        (e) => e.event === 'generate_lead',
      );
      expect(lead?.event_params).toMatchObject({
        event_id: posted.eventId,
        form_id: 'contact',
        lead_source: 'contact_form',
      });
    });
  });

  it('pushes nothing when the submit fails', async () => {
    vi.mocked(submitContactMessage).mockRejectedValue(new Error('nope'));
    fill();
    await waitFor(() => expect(submitContactMessage).toHaveBeenCalledTimes(1));
    await screen.findByText('nope');
    expect((window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer).toEqual([]);
  });
});

describe.each([
  ['QuoteForm', 'quote'],
  ['StitchEstimator', 'estimator'],
] as const)('generate_lead from %s', (which, formId) => {
  const run = async () => {
    if (which === 'QuoteForm') {
      const copy = parseGlobal('quoteForm', {});
      render(<QuoteForm services={[]} copy={copy} />);
      fireEvent.click(screen.getByRole('button', { name: copy.buttons.continueToDamage }));
      fireEvent.click(screen.getByRole('button', { name: copy.buttons.continueToContact }));
      fireEvent.change(screen.getByPlaceholderText(copy.placeholders.name), { target: { value: 'Pat' } });
      fireEvent.change(screen.getByPlaceholderText(copy.placeholders.phone), { target: { value: '0871234567' } });
      fireEvent.change(screen.getByPlaceholderText(copy.placeholders.email), { target: { value: 'p@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: copy.buttons.submit }));
    } else {
      render(<StitchEstimator />);
      fireEvent.click(screen.getByRole('button', { name: /Continue my free quote/ }));
      fireEvent.change(screen.getByPlaceholderText('e.g. Liam Murphy'), { target: { value: 'Pat' } });
      fireEvent.change(screen.getByPlaceholderText('+353 87 123 4567'), { target: { value: '0871234567' } });
      fireEvent.change(screen.getByPlaceholderText('name@example.ie'), { target: { value: 'p@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Send my free quote request/ }));
    }
    await waitFor(() => expect(submitQuoteRequest).toHaveBeenCalledTimes(1));
  };

  beforeEach(() => {
    vi.mocked(submitQuoteRequest).mockReset();
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
  });

  it('pushes generate_lead with the posted event id', async () => {
    vi.mocked(submitQuoteRequest).mockResolvedValue({} as never);
    await run();
    const posted = vi.mocked(submitQuoteRequest).mock.calls[0]![0];
    await waitFor(() => {
      const lead = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer.find(
        (e) => e.event === 'generate_lead',
      );
      expect(lead?.event_params).toMatchObject({
        event_id: posted.eventId,
        form_id: formId,
        lead_source: 'quote_form',
      });
    });
  });

  it('pushes nothing when the submit fails', async () => {
    vi.mocked(submitQuoteRequest).mockRejectedValue(new Error('nope'));
    await run();
    await screen.findByText('nope');
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([]);
  });
});
