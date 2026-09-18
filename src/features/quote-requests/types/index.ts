import type { QuoteRequest, NewQuoteRequest } from '@/server/db/schema';
import {
  QUOTE_STATUSES,
  type CreateQuoteRequestInput,
  type QuoteRequestListQuery,
  type QuoteStatus,
  type UpdateQuoteRequestInput,
} from '@/validations/quote-request-schema';

export { QUOTE_STATUSES };

export type {
  QuoteRequest,
  NewQuoteRequest,
  CreateQuoteRequestInput,
  UpdateQuoteRequestInput,
  QuoteRequestListQuery,
  QuoteStatus,
};

export interface QuoteRequestStats {
  all: number;
  new: number;
  contacted: number;
  in_progress: number;
  quoted: number;
  completed: number;
  archived: number;
}
