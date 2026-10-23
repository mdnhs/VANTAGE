'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useActor } from '@/contexts/actor-provider';
import { authRequest } from '@/features/auth/lib/auth-errors';
import { authClient } from '@/lib/auth-client';

import { ProfileSchema } from '../lib/schemas';

export function ProfileForm() {
  const { user } = useActor();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = ProfileSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your name');
      return;
    }
    setError(null);
    setBusy(true);
    const { failure } = await authRequest(() => authClient.updateUser({ name: parsed.data.name }));
    setBusy(false);
    if (failure?.kind === 'rejected' && failure.code === 'INVALID_PROFILE') {
      setError(failure.fieldErrors?.name?.[0] ?? 'Check your name and try again.');
      return;
    }
    if (failure) {
      setFormError(failure.message ?? "Couldn't save your profile. Try again.");
      return;
    }
    toast.success('Profile saved');
    // The shell's name and avatar come from the server layout.
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className='flex flex-col gap-4'>
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor='account-name'>Name</FieldLabel>
        <Input id='account-name' autoComplete='name' value={name} onChange={(e) => setName(e.target.value)} />
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
      {formError ? (
        <p role='alert' className='text-sm text-destructive'>
          {formError}
        </p>
      ) : null}
      <div>
        <Button type='submit' disabled={busy}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
