import type { LegalPage } from '@/server/db/schema';
import type {
  CreateLegalPageInput,
  ReorderLegalPagesInput,
  TiptapDoc,
  UpdateLegalPageInput,
} from '@/validations/legal-page-schema';

export type { LegalPage, CreateLegalPageInput, UpdateLegalPageInput, ReorderLegalPagesInput, TiptapDoc };

export interface LegalPageListFilters {
  page: number;
  limit: number;
}
