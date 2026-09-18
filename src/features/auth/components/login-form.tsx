'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useLogin } from '@/features/auth/hooks/use-login';

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.push(APP_ROUTES.dashboard.index);
          router.refresh();
        },
      },
    );
  };

  return (
    <Card className='w-full max-w-sm overflow-hidden p-0 md:max-w-4xl'>
      <CardContent className='grid p-0 md:grid-cols-2'>
        <form onSubmit={handleSubmit} className='p-6 md:p-8'>
          <FieldGroup>
            <div className='flex flex-col items-center gap-2 text-center'>
              <h1 className='text-2xl font-bold'>Vantage Admin</h1>
              <p className='text-balance text-muted-foreground'>Sign in to manage the site</p>
            </div>
            <Field>
              <FieldLabel htmlFor='email'>Email</FieldLabel>
              <Input
                id='email'
                type='email'
                placeholder='admin@example.com'
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
        <div className='relative hidden flex-col items-center justify-center gap-4 bg-primary p-8 text-primary-foreground md:flex'>
          <LayoutDashboard className='size-12' />
          <div className='text-center'>
            <p className='text-lg font-semibold'>Content management</p>
            <p className='text-sm text-primary-foreground/80'>
              Services, projects, testimonials and site settings — all in one place.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
