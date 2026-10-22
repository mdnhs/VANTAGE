import { z } from 'zod';

import type { AuthFailure } from '@/features/auth/lib/auth-errors';

// Same rules the server enforces (admin roles need 12; the name is trimmed, 1-100).
export const ADMIN_MIN_PASSWORD_LENGTH = 12;

export const ProfileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100, 'Keep it under 100 characters'),
});

export const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(ADMIN_MIN_PASSWORD_LENGTH, `Use at least ${ADMIN_MIN_PASSWORD_LENGTH} characters`),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: "The passwords don't match",
  });

export type FormOutcome = { fieldErrors: Record<string, string[]> } | { formError: string };

// Wording for a failed change-password call (Better Auth rejects with a code).
export function passwordFailure(failure: AuthFailure): FormOutcome {
  if (failure.kind === 'rejected') {
    if (failure.code === 'PASSWORD_TOO_SHORT') {
      return {
        fieldErrors: { newPassword: [`Admin passwords need at least ${ADMIN_MIN_PASSWORD_LENGTH} characters`] },
      };
    }
    if (failure.code === 'INVALID_PASSWORD') {
      return { fieldErrors: { currentPassword: ["That password isn't right."] } };
    }
    return { formError: "Couldn't change your password. Try again." };
  }
  return { formError: failure.message };
}
