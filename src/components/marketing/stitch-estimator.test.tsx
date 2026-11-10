// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitQuoteRequest } from '@/features/quote-requests/services/api';
import { parseGlobal } from '@/lib/content/globals';

import { StitchEstimator } from './stitch-estimator';

vi.mock('@/features/quote-requests/services/api', () => ({ submitQuoteRequest: vi.fn() }));

afterEach(cleanup);

describe('StitchEstimator on different pages', () => {
  const submitFrom = async (source?: 'quote_page') => {
    vi.mocked(submitQuoteRequest).mockReset();
    vi.mocked(submitQuoteRequest).mockResolvedValue({} as never);
    const copy = parseGlobal('quoteForm', {});
    render(
      <StitchEstimator services={[]} copy={copy} heading={parseGlobal('page.home', {}).quoteSection} source={source} />,
    );
    fireEvent.change(screen.getByPlaceholderText(copy.placeholders.name), { target: { value: 'Pat' } });
    fireEvent.change(screen.getByPlaceholderText(copy.placeholders.phone), { target: { value: '0871234567' } });
    fireEvent.change(screen.getByPlaceholderText(copy.placeholders.email), { target: { value: 'p@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: copy.buttons.submit }));
    await waitFor(() => expect(submitQuoteRequest).toHaveBeenCalledTimes(1));
    return vi.mocked(submitQuoteRequest).mock.calls[0]![0].source;
  };

  it('labels a quote from the homepage', async () => {
    expect(await submitFrom()).toBe('homepage_estimator');
  });

  it('labels a quote from the Get a quote page', async () => {
    expect(await submitFrom('quote_page')).toBe('quote_page');
  });
});

describe('StitchEstimator error message', () => {
  it('draws the error in the readable brand-soft token', async () => {
    vi.mocked(submitQuoteRequest).mockRejectedValue(new Error('nope'));
    const copy = parseGlobal('quoteForm', {});
    render(<StitchEstimator services={[]} copy={copy} heading={parseGlobal('page.home', {}).quoteSection} />);
    fireEvent.change(screen.getByPlaceholderText(copy.placeholders.name), { target: { value: 'Pat' } });
    fireEvent.change(screen.getByPlaceholderText(copy.placeholders.phone), { target: { value: '0871234567' } });
    fireEvent.change(screen.getByPlaceholderText(copy.placeholders.email), { target: { value: 'p@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: copy.buttons.submit }));
    await waitFor(() => expect(submitQuoteRequest).toHaveBeenCalledTimes(1));
    const message = await screen.findByText('nope');
    expect(message.className).toContain('text-brand-soft');
  });
});
