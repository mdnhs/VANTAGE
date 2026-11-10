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
    render(<LinkifiedText text='Call 0852785974 or javascript:alert(1)' />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('turns a site path into a link on the current origin', () => {
    render(<LinkifiedText text={'Send photos here:\n/get-a-quote\nThanks'} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/get-a-quote');
    expect(link.textContent).toBe(`${window.location.origin}/get-a-quote`);
    expect(link.getAttribute('target')).toBeNull();
  });
});
