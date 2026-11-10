// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { QuoteButton, QuoteCtaProvider, QuoteCtaText } from './quote-cta';

afterEach(cleanup);

describe('quote CTA', () => {
  it('shows the one label from the provider in every button', () => {
    render(
      <QuoteCtaProvider label='Book my estimate'>
        <QuoteButton />
        <QuoteCtaText />
      </QuoteCtaProvider>,
    );
    const link = screen.getByRole('link', { name: 'Book my estimate' });
    expect(link.getAttribute('href')).toBe('/get-a-quote');
    expect(screen.getAllByText('Book my estimate')).toHaveLength(2);
  });

  it('falls back to the default wording outside a provider', () => {
    render(<QuoteButton />);
    expect(screen.getByRole('link', { name: 'Get a Free Quote' })).toBeTruthy();
  });
});
