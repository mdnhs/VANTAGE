import { and, eq, isNull, or, type SQL } from 'drizzle-orm';

import { quoteRequests, type QuoteRequest } from '@/server/db/schema';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';

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

// Refusal for marking a quote with money records as spam.
export const SPAM_BILLING_ERROR = () => {
  const message = "This quote has invoice or payment records, so it can't be marked as spam.";
  return new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 422, { status: [message] });
};
