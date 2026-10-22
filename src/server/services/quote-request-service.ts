import { SPAM_STATUS, type SpamReason } from '@/lib/enquiries/spam';
import { hasBillingData, SPAM_BILLING_ERROR } from '@/server/lib/enquiries/billing';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { quoteRequestRepository } from '@/server/repositories/quote-request-repository';
import { notifyNewQuote } from '@/server/services/enquiry-notify';
import { listAssignees } from '@/server/services/user-admin/assignees';
import type {
  CreateQuoteRequestOutput,
  QuoteRequestListQuery,
  UpdateQuoteRequestOutput,
} from '@/validations/quote-request-schema';

// An assignee must be someone /admin/assignees would offer.
async function assertAssignable(userId: string | null | undefined) {
  if (!userId) return;
  const assignees = await listAssignees();
  if (!assignees.some((a) => a.id === userId)) {
    const message = 'Choose an active team member who can work on quotes';
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, message, 422, { assignedUserId: [message] });
  }
}

export const quoteRequestService = {
  async list(params: QuoteRequestListQuery) {
    return quoteRequestRepository.list(params);
  },

  async stats() {
    return quoteRequestRepository.stats();
  },

  async byId(id: string) {
    return quoteRequestRepository.byId(id);
  },

  // `notify: false` for staff-entered enquiries (phone / walk-in): no one to alert, no auto-reply.
  // `spamReason` files the row as spam and sends nothing.
  async create(
    data: CreateQuoteRequestOutput,
    options: { notify?: boolean; photoMediaIds?: string[]; spamReason?: SpamReason } = {},
  ) {
    await assertAssignable(data.assignedUserId);
    const row = await quoteRequestRepository.create(data, options.photoMediaIds, options.spamReason);
    // After the row is committed; fire-and-forget, so mail never fails the request.
    if (options.notify !== false && !options.spamReason && row) notifyNewQuote(row);
    return row;
  },

  async update(id: string, data: UpdateQuoteRequestOutput) {
    await assertAssignable(data.assignedUserId);
    // Billing sent in the same patch counts; the repository checks what is already stored.
    if (
      data.status === SPAM_STATUS &&
      hasBillingData({
        invoiceNumber: data.invoiceNumber ?? null,
        paymentStatus: data.paymentStatus ?? 'unpaid',
        paidAmount: data.paidAmount != null ? String(data.paidAmount) : null,
        paymentMethod: data.paymentMethod ?? null,
      })
    )
      throw SPAM_BILLING_ERROR();
    return quoteRequestRepository.update(id, data);
  },

  async remove(id: string) {
    return quoteRequestRepository.remove(id);
  },
};
