'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAccountLogin } from '@/features/account/hooks/use-account-login';

// Accounts here are admin-provisioned only — there is deliberately no sign-up link.
export function AccountLoginForm() {
  const router = useRouter();
  const login = useAccountLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.push('/');
          router.refresh();
        },
      },
    );
  };

  return (
    <Card className='w-full max-w-sm p-0'>
      <CardContent className='p-6 md:p-8'>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className='flex flex-col items-center gap-2 text-center'>
              <h1 className='text-2xl font-bold'>Sign in</h1>
              <p className='text-balance text-muted-foreground'>Use the account your administrator created for you</p>
            </div>
            <Field>
              <FieldLabel htmlFor='email'>Email</FieldLabel>
              <Input
                id='email'
                type='email'
                autoComplete='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='password'>Password</FieldLabel>
              <Input
                id='password'
                type='password'
                autoComplete='current-password'
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {login.isError && <p className='text-sm text-destructive'>{login.error.message}</p>}
            <Field>
              <Button type='submit' disabled={login.isPending}>
                {login.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
