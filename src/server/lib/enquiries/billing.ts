import { and, eq, isNull, or, type SQL } from 'drizzle-orm';

import { quoteRequests, type QuoteRequest } from '@/server/db/schema';

// A quote carries no money when every billing column is empty: no invoice number, still
// 'unpaid', nothing paid, no payment method. Retention relies on exactly this.
export const noBillingData = (): SQL =>
  and(
    isNull(quoteRequests.invoiceNumber),
    eq(quoteRequests.paymentStatus, 'unpaid'),
    or(isNull(quoteRequests.paidAmount), eq(quoteRequests.paidAmount, '0'))!,
    isNull(quoteRequests.paymentMethod),
  )!;

// JS mirror of `noBillingData`, negated.
export const hasBillingData = (
  row: Pick<QuoteRequest, 'invoiceNumber' | 'paymentStatus' | 'paidAmount' | 'paymentMethod'>,
): boolean =>
  row.invoiceNumber !== null ||
  row.paymentStatus !== 'unpaid' ||
  !(row.paidAmount === null || Number(row.paidAmount) === 0) ||
  row.paymentMethod !== null;
