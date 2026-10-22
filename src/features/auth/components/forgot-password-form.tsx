'use client';

import { useId, useState, type FormEvent } from 'react';
import { MailCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { authRequest, UNREACHABLE } from '../lib/auth-errors';
import { authButtonClass, authInputClass } from './styles';

export function ForgotPasswordForm() {
  const uid = useId();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { failure } = await authRequest(() =>
      authClient.requestPasswordReset({
        email: String(new FormData(event.currentTarget).get('email')),
        redirectTo: APP_ROUTES.auth.resetPassword,
      }),
    );
    setPending(false);
    // The server answers the same for unknown emails, so success never
    // reveals whether an account exists. Only real failures are shown.
    if (failure) return setError(failure.message ?? UNREACHABLE);
    setSent(true);
  }

  if (sent) {
    return (
      <div role='status' className='flex items-start gap-4 rounded-2xl bg-accent p-5 text-accent-foreground'>
        <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary'>
          <MailCheckIcon className='size-5' />
        </span>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-semibold'>Check your inbox</p>
          <p className='text-sm leading-relaxed'>
            If that email has an account, a reset link is on its way. It works for 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={`${uid}-email`}>Email</FieldLabel>
          <Input
            id={`${uid}-email`}
            name='email'
            type='email'
            autoComplete='email'
            placeholder='you@example.com'
            required
            className={authInputClass}
          />
          {error && <FieldError errors={[{ message: error }]} />}
        </Field>
        <Button type='submit' disabled={pending} className={authButtonClass}>
          {pending ? 'Sending…' : 'Send reset link'}
        </Button>
      </FieldGroup>
    </form>
  );
}
