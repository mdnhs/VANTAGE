import { describe, expect, it } from 'vitest';

import { hasBillingData } from './billing';

const clean = { invoiceNumber: null, paymentStatus: 'unpaid', paidAmount: '0.00', paymentMethod: null };

describe('hasBillingData', () => {
  it('is false when nothing billing-related is filled', () => {
    expect(hasBillingData(clean)).toBe(false);
    expect(hasBillingData({ ...clean, paidAmount: null })).toBe(false);
  });

  it.each([
    ['invoiceNumber', 'INV-1'],
    ['paymentStatus', 'paid'],
    ['paidAmount', '10.00'],
    ['paymentMethod', 'card'],
  ])('is true when %s is filled', (field, value) => {
    expect(hasBillingData({ ...clean, [field]: value })).toBe(true);
  });
});
