import { describe, expect, it } from 'vitest';

import { PasswordSchema, ProfileSchema, passwordFailure } from './schemas';

const ok = { currentPassword: 'old-password-1', newPassword: 'a-long-enough-pw', confirmPassword: 'a-long-enough-pw' };

describe('PasswordSchema', () => {
  it('accepts 12+ characters that match', () => {
    expect(PasswordSchema.safeParse(ok).success).toBe(true);
  });
  it('rejects 11 characters', () => {
    const r = PasswordSchema.safeParse({ ...ok, newPassword: 'elevenchars', confirmPassword: 'elevenchars' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('Use at least 12 characters');
  });
  it('rejects a mismatched confirmation on confirmPassword', () => {
    const r = PasswordSchema.safeParse({ ...ok, confirmPassword: 'different-password' });
    expect(r.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });
});

describe('ProfileSchema', () => {
  it('trims and bounds the name like the server', () => {
    expect(ProfileSchema.parse({ name: '  Ada ' })).toEqual({ name: 'Ada' });
    expect(ProfileSchema.safeParse({ name: '  ' }).success).toBe(false);
    expect(ProfileSchema.safeParse({ name: 'x'.repeat(101) }).success).toBe(false);
  });
});

describe('passwordFailure', () => {
  it('shows the server error for a too-short admin password', () => {
    expect(passwordFailure({ kind: 'rejected', message: null, code: 'PASSWORD_TOO_SHORT' })).toEqual({
      fieldErrors: { newPassword: ['Admin passwords need at least 12 characters'] },
    });
  });
  it('maps a wrong current password to its field', () => {
    expect(passwordFailure({ kind: 'rejected', message: null, code: 'INVALID_PASSWORD' })).toEqual({
      fieldErrors: { currentPassword: ["That password isn't right."] },
    });
  });
  it('passes through rate limit text and words an unknown rejection', () => {
    expect(passwordFailure({ kind: 'rate-limited', message: 'slow down' })).toEqual({ formError: 'slow down' });
    expect(passwordFailure({ kind: 'rejected', message: null })).toEqual({
      formError: "Couldn't change your password. Try again.",
    });
  });
});
