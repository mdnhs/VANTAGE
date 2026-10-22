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
  async create(data: CreateQuoteRequestOutput, options: { notify?: boolean; photoMediaIds?: string[] } = {}) {
    await assertAssignable(data.assignedUserId);
    const row = await quoteRequestRepository.create(data, options.photoMediaIds);
    // After the row is committed; fire-and-forget, so mail never fails the request.
    if (options.notify !== false && row) notifyNewQuote(row);
    return row;
  },

  async update(id: string, data: UpdateQuoteRequestOutput) {
    await assertAssignable(data.assignedUserId);
    return quoteRequestRepository.update(id, data);
  },

  async remove(id: string) {
    return quoteRequestRepository.remove(id);
  },
};
