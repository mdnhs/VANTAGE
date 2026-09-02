// Standard service layer response
export interface ServiceResponse<T> {
  error: boolean;
  message: string;
  data: T | null;
  pagination?: PaginationType;
  status?: number;
  // Field-level validation errors from the API: { email: ['Invalid email'] }
  causes?: Record<string, string[]>;
}

// Mirrors PaginationMeta from src/server/lib/response.ts
export interface PaginationType {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
