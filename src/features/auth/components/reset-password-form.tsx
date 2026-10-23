'use client';

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { authClient } from '@/lib/auth-client';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { authRequest } from '../lib/auth-errors';
import { PasswordInput } from './password-input';
import { authButtonClass } from './styles';

// Admin roles need 12+ characters (server: 400 PASSWORD_TOO_SHORT).
export const MIN_PASSWORD_LENGTH = 12;

export function ResetPasswordForm({ token, invite }: { token: string; invite: boolean }) {
  const router = useRouter();
  const uid = useId();
  // Each message sits under, and marks, the field it is about.
  const [error, setError] = useState<{ field: 'password' | 'confirm'; message: string } | null>(null);
  const [pending, setPending] = useState(false);

  const passwordError = error?.field === 'password' ? error.message : null;
  const confirmError = error?.field === 'confirm' ? error.message : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError({ field: 'password', message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    if (password !== String(form.get('confirm'))) {
      return setError({ field: 'confirm', message: "The two passwords don't match." });
    }
    setPending(true);
    setError(null);
    const { failure } = await authRequest(() => authClient.resetPassword({ newPassword: password, token }));
    if (failure) {
      setPending(false);
      if (failure.kind === 'rejected' && failure.code === 'PASSWORD_TOO_SHORT') {
        return setError({ field: 'password', message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
      }
      return setError({
        field: 'confirm',
        message: failure.message ?? 'This link has expired or was already used. Ask for a new one.',
      });
    }
    // The sign-in page words the confirmation from `done`.
    router.replace(`${APP_ROUTES.auth.login}?done=${invite ? 'invite' : 'reset'}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={passwordError ? true : undefined}>
          <FieldLabel htmlFor={`${uid}-password`}>{invite ? 'Choose a password' : 'New password'}</FieldLabel>
          <PasswordInput
            id={`${uid}-password`}
            name='password'
            autoComplete='new-password'
            minLength={MIN_PASSWORD_LENGTH}
            required
            aria-describedby={`${uid}-password-hint`}
            aria-invalid={passwordError ? true : undefined}
          />
          <FieldDescription id={`${uid}-password-hint`}>
            At least {MIN_PASSWORD_LENGTH} characters. A short phrase is easiest to remember.
          </FieldDescription>
          {passwordError && <FieldError errors={[{ message: passwordError }]} />}
        </Field>
        <Field data-invalid={confirmError ? true : undefined}>
          <FieldLabel htmlFor={`${uid}-confirm`}>Repeat password</FieldLabel>
          <PasswordInput
            id={`${uid}-confirm`}
            name='confirm'
            autoComplete='new-password'
            required
            aria-invalid={confirmError ? true : undefined}
          />
          {confirmError && <FieldError errors={[{ message: confirmError }]} />}
        </Field>
        <Button type='submit' disabled={pending} className={authButtonClass}>
          {pending ? 'Saving…' : invite ? 'Set password' : 'Update password'}
        </Button>
      </FieldGroup>
    </form>
  );
}
