// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitQuoteRequest } from '@/features/quote-requests/services/api';

import { StitchEstimator } from './stitch-estimator';

vi.mock('@/features/quote-requests/services/api', () => ({ submitQuoteRequest: vi.fn() }));

afterEach(cleanup);

describe('StitchEstimator error message', () => {
  it('draws the error in the readable brand-soft token', async () => {
    vi.mocked(submitQuoteRequest).mockRejectedValue(new Error('nope'));
    render(<StitchEstimator />);
    fireEvent.click(screen.getByRole('button', { name: /Continue my free quote/ }));
    fireEvent.change(screen.getByPlaceholderText('e.g. Liam Murphy'), { target: { value: 'Pat' } });
    fireEvent.change(screen.getByPlaceholderText('+353 87 123 4567'), { target: { value: '0871234567' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.ie'), { target: { value: 'p@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send my free quote request/ }));
    await waitFor(() => expect(submitQuoteRequest).toHaveBeenCalledTimes(1));
    const message = await screen.findByText('nope');
    expect(message.className).toContain('text-brand-soft');
  });
});
