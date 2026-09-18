import { quoteRequestRepository } from '@/server/repositories/quote-request-repository';
import type {
  CreateQuoteRequestInput,
  QuoteRequestListQuery,
  UpdateQuoteRequestInput,
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

  async create(data: CreateQuoteRequestInput) {
    return quoteRequestRepository.create(data);
  },

  async update(id: string, data: UpdateQuoteRequestInput) {
    return quoteRequestRepository.update(id, data);
  },

  async remove(id: string) {
    return quoteRequestRepository.remove(id);
  },
};
