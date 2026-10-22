'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { PasswordInput } from '@/features/auth/components/password-input';
import { useResetOnHide } from '@/features/auth/hooks/use-reset-on-hide';
import { authRequest } from '@/features/auth/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';

import { accountKeys } from '../lib/query-keys';
import { PasswordSchema, passwordFailure } from '../lib/schemas';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };
type Errors = Record<string, string | undefined>;

export function PasswordForm() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Cache Components keeps this route mounted but hidden once the user moves on;
  // resetting drops typed passwords from the hidden DOM.
  const begin = useResetOnHide(() => {
    setValues(EMPTY);
    setErrors({});
    setFormError(null);
    setBusy(false);
  });

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = PasswordSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    const current = begin();
    // The server forces revokeOtherSessions too; sent so the intent is visible here.
    const { failure } = await authRequest(() =>
      authClient.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      }),
    );
    if (!current()) return;
    setBusy(false);
    if (failure) {
      const outcome = passwordFailure(failure);
      if ('fieldErrors' in outcome) {
        setErrors(Object.fromEntries(Object.entries(outcome.fieldErrors).map(([k, v]) => [k, v[0]])));
      } else {
        setFormError(outcome.formError);
      }
      return;
    }
    setValues(EMPTY);
    toast.success('Password changed. Your other devices are signed out.');
    void queryClient.invalidateQueries({ queryKey: accountKeys.sessions });
  }

  const fields = [
    ['currentPassword', 'Current password', 'current-password'],
    ['newPassword', 'New password', 'new-password'],
    ['confirmPassword', 'Confirm new password', 'new-password'],
  ] as const;

  return (
    <form onSubmit={submit} noValidate className='flex flex-col gap-4'>
      {fields.map(([key, label, autoComplete]) => (
        <Field key={key} data-invalid={errors[key] ? true : undefined}>
          <FieldLabel htmlFor={`account-${key}`}>{label}</FieldLabel>
          <PasswordInput
            id={`account-${key}`}
            autoComplete={autoComplete}
            value={values[key]}
            onChange={set(key)}
            aria-invalid={errors[key] ? true : undefined}
          />
          {errors[key] ? <FieldError>{errors[key]}</FieldError> : null}
        </Field>
      ))}
      {formError ? (
        <p role='alert' className='text-sm text-destructive'>
          {formError}
        </p>
      ) : null}
      <div>
        <Button type='submit' disabled={busy}>
          Change password
        </Button>
      </div>
    </form>
  );
}
