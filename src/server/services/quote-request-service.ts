import { quoteRequestRepository } from '@/server/repositories/quote-request-repository';
import type {
  CreateQuoteRequestOutput,
  QuoteRequestListQuery,
  UpdateQuoteRequestOutput,
} from '@/validations/quote-request-schema';

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

  async create(data: CreateQuoteRequestOutput) {
    return quoteRequestRepository.create(data);
  },

  async update(id: string, data: UpdateQuoteRequestOutput) {
    return quoteRequestRepository.update(id, data);
  },

  async remove(id: string) {
    return quoteRequestRepository.remove(id);
  },
};
