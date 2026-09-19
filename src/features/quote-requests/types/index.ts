import type { QuoteRequest as DbQuoteRequest, NewQuoteRequest, AdminUser } from '@/server/db/schema';
import {
  QUOTE_STATUSES,
  PIPELINE_STATUSES,
  ALL_QUOTE_STATUSES,
  QUOTE_SOURCES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  type CreateQuoteRequestInput,
  type QuoteRequestListQuery,
  type QuoteStatus,
  type PipelineStatus,
  type QuoteSource,
  type PaymentStatus,
  type PaymentMethod,
  type UpdateQuoteRequestInput,
} from '@/validations/quote-request-schema';

export { QUOTE_STATUSES, PIPELINE_STATUSES, ALL_QUOTE_STATUSES, QUOTE_SOURCES, PAYMENT_STATUSES, PAYMENT_METHODS };

export type QuoteRequest = DbQuoteRequest & {
  assignedAdmin?: Pick<AdminUser, 'id' | 'name' | 'email'> | null;
};

export type QuoteRequestWithStaff = QuoteRequest;

export type {
  DbQuoteRequest,
  NewQuoteRequest,
  CreateQuoteRequestInput,
  UpdateQuoteRequestInput,
  QuoteRequestListQuery,
  QuoteStatus,
  PipelineStatus,
  QuoteSource,
  PaymentStatus,
  PaymentMethod,
};

export interface QuoteRequestStats {
  all: number;
  new: number;
  contacted: number;
  waiting_response: number;
  quote_sent: number;
  approved: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  // Legacy support
  quoted?: number;
  archived?: number;
}
