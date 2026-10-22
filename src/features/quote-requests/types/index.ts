import type { EnquiryPhoto } from '@/lib/media/enquiry-photo';
import type { QuoteRequest as DbQuoteRequest, NewQuoteRequest, User } from '@/server/db/schema';
import {
  QUOTE_STATUSES,
  PIPELINE_STATUSES,
  ALL_QUOTE_STATUSES,
  QUOTE_SOURCES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  type CreateQuoteRequestInput,
  type PublicQuoteRequestInput,
  type QuoteRequestListQuery,
  type QuoteStatus,
  type PipelineStatus,
  type QuoteSource,
  type PaymentStatus,
  type PaymentMethod,
  type UpdateQuoteRequestInput,
} from '@/validations/quote-request-schema';

export { QUOTE_STATUSES, PIPELINE_STATUSES, ALL_QUOTE_STATUSES, QUOTE_SOURCES, PAYMENT_STATUSES, PAYMENT_METHODS };

export type QuoteRequest = Omit<DbQuoteRequest, 'photoUrls'> & {
  photos: EnquiryPhoto[];
  assignedUser?: Pick<User, 'id' | 'name' | 'email'> | null;
};

export type QuoteRequestWithStaff = QuoteRequest;

export type {
  DbQuoteRequest,
  NewQuoteRequest,
  CreateQuoteRequestInput,
  PublicQuoteRequestInput,
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
