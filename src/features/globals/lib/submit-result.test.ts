import { describe, expect, it } from 'vitest';

import { GlobalApiError } from '../services/api';
import { CONFLICT_MESSAGE, isConflict, submitResultFromError } from './submit-result';

describe('submitResultFromError', () => {
  it('maps a 409 to the friendly conflict message', () => {
    const error = new GlobalApiError('Version conflict', 409, 'CONFLICT', undefined, {
      version: 3,
      updatedAt: '2026-10-22T10:00:00.000Z',
      updatedBy: 'Alex',
    });
    expect(isConflict(error)).toBe(true);
    expect(submitResultFromError(error)).toEqual({
      formError: 'Someone else saved this a moment ago. Their version is loaded; make your change again.',
    });
    expect(CONFLICT_MESSAGE).toBe(
      'Someone else saved this a moment ago. Their version is loaded; make your change again.',
    );
  });

  it('maps a 422 onto form and field errors', () => {
    const error = new GlobalApiError('Validation failed', 422, 'VALIDATION_ERROR', { 'phone.e164': ['Use E.164'] });
    expect(isConflict(error)).toBe(false);
    expect(submitResultFromError(error)).toEqual({
      formError: 'Validation failed',
      fieldErrors: { 'phone.e164': ['Use E.164'] },
    });
  });

  it('shows the server message for a refusal (403)', () => {
    const error = new GlobalApiError('You do not have permission', 403, 'FORBIDDEN');
    expect(submitResultFromError(error)).toEqual({ formError: 'You do not have permission' });
  });

  it('leaves unexpected errors to the caller', () => {
    expect(submitResultFromError(new TypeError('Failed to fetch'))).toBeNull();
  });
});
