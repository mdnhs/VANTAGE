import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ERROR_CODES, type ErrorCode } from './errors';

export interface PaginationMeta {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SuccessBody<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
}

export interface ErrorBody {
  success: false;
  error: { code: ErrorCode; message: string; causes?: Record<string, string[]> };
}

export const ok = <T>(c: Context, data: T, init?: { status?: ContentfulStatusCode; pagination?: PaginationMeta }) =>
  c.json<SuccessBody<T>>(
    { success: true, data, ...(init?.pagination ? { pagination: init.pagination } : {}) },
    init?.status ?? 200,
  );

export const fail = (
  c: Context,
  code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
  message = 'Something went wrong',
  status: ContentfulStatusCode = 500,
  causes?: Record<string, string[]>,
) => c.json<ErrorBody>({ success: false, error: { code, message, ...(causes ? { causes } : {}) } }, status);

export const buildPagination = (total: number, page: number, limit: number): PaginationMeta => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    total,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
