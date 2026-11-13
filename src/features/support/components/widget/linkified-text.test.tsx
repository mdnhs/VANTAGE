// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { LinkifiedText } from './linkified-text';

afterEach(cleanup);

describe('LinkifiedText', () => {
  it('turns an https link into a new-tab anchor and keeps trailing punctuation outside it', () => {
    render(
      <p>
        Quote: <LinkifiedText text='Get a quote at https://autopaintshop.ie/get-a-quote. Thanks!' />
      </p>,
    );
    const link = screen.getByRole('link', { name: 'https://autopaintshop.ie/get-a-quote' });
    expect(link.getAttribute('href')).toBe('https://autopaintshop.ie/get-a-quote');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('leaves text without links, and non-http schemes, alone', () => {
    render(<LinkifiedText text='Open 2026-11-08, javascript:alert(1)' />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('turns a phone number into a tel: link and a WhatsApp number into a wa.me link', () => {
    render(<LinkifiedText text={'📞 Phone: 0852785974\n💬 WhatsApp: +353 894400191\nThanks'} />);
    const phone = screen.getByRole('link', { name: '0852785974' });
    expect(phone.getAttribute('href')).toBe('tel:+353852785974');
    const wa = screen.getByRole('link', { name: '+353 894400191' });
    expect(wa.getAttribute('href')).toBe('https://wa.me/353894400191');
    expect(wa.getAttribute('target')).toBe('_blank');
  });

  it('turns an email address into a mailto: link, leaving trailing punctuation outside', () => {
    render(<LinkifiedText text='Email info@autopaintshop.ie.' />);
    const link = screen.getByRole('link', { name: 'info@autopaintshop.ie' });
    expect(link.getAttribute('href')).toBe('mailto:info@autopaintshop.ie');
  });

  it('turns a site path into a link on the current origin', () => {
    render(<LinkifiedText text={'Send photos here:\n/get-a-quote\nThanks'} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/get-a-quote');
    expect(link.textContent).toBe(`${window.location.origin}/get-a-quote`);
    expect(link.getAttribute('target')).toBeNull();
  });
});
