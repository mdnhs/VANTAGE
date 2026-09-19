'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Eye, EyeOff, LayoutDashboard, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cldUrl } from '@/lib/cloudinary/url';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useLogin } from '@/features/auth/hooks/use-login';
import { LottieLogo } from '@/components/ui/lottie-logo';

interface LoginFormProps {
  businessName: string;
  logoPublicId: string | null;
  logoLottieJson?: string | null;
  logoUseLottie?: boolean;
}

function Brand({ businessName, logoPublicId, logoLottieJson, logoUseLottie }: LoginFormProps) {
  return (
    <div className='flex items-center gap-3'>
      {logoUseLottie && logoLottieJson ? (
        <LottieLogo
          data={logoLottieJson}
          alt={businessName}
          className='size-10 object-contain'
          fallback={
            logoPublicId ? (
              <Image
                src={cldUrl(logoPublicId, { width: 80, height: 80, crop: 'fit' })}
                alt={businessName}
                width={40}
                height={40}
                className='size-10 object-contain'
              />
            ) : (
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                <LayoutDashboard className='size-5' />
              </div>
            )
          }
        />
      ) : logoPublicId ? (
        <Image
          src={cldUrl(logoPublicId, { width: 80, height: 80, crop: 'fit' })}
          alt={businessName}
          width={40}
          height={40}
          className='size-10 object-contain'
        />
      ) : (
        <div className='flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
          <LayoutDashboard className='size-5' />
        </div>
      )}
      <div className='flex flex-col leading-tight'>
        <span className='text-sm font-semibold'>{businessName}</span>
        <span className='text-xs opacity-70'>Content CMS</span>
      </div>
    </div>
  );
}

export function LoginForm({ businessName, logoPublicId, logoLottieJson, logoUseLottie }: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className='grid min-h-svh w-full lg:grid-cols-2'>
      {/* Brand panel */}
      <div className='relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-white lg:flex'>
        <Image
          src='/assets/marketing/stitch-hero.jpg'
          alt=''
          fill
          priority
          sizes='50vw'
          className='object-cover opacity-40'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30' />

        <div className='relative z-10'>
          <Brand
            businessName={businessName}
            logoPublicId={logoPublicId}
            logoLottieJson={logoLottieJson}
            logoUseLottie={logoUseLottie}
          />
        </div>

        <div className='relative z-10 flex max-w-md flex-col gap-4'>
          <span className='h-1 w-12 rounded-full bg-red-600' />
          <h2 className='text-3xl leading-tight font-bold tracking-tight text-balance'>
            Run your website from one place.
          </h2>
          <p className='text-sm leading-relaxed text-white/70'>
            Update pages, services and projects, and follow up quote requests and customer messages as they come in.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className='flex flex-col px-6 py-8 sm:px-10'>
        <div className='lg:hidden'>
          <Brand
            businessName={businessName}
            logoPublicId={logoPublicId}
            logoLottieJson={logoLottieJson}
            logoUseLottie={logoUseLottie}
          />
        </div>

        <div className='flex flex-1 items-center justify-center'>
          <form onSubmit={handleSubmit} className='w-full max-w-sm'>
            <FieldGroup>
              <div className='flex flex-col gap-1.5'>
                <h1 className='text-2xl font-bold tracking-tight'>Welcome back</h1>
                <p className='text-sm text-muted-foreground'>Sign in to your admin account to continue.</p>
              </div>

              <Field>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  id='email'
                  type='email'
                  placeholder='admin@example.com'
                  autoComplete='email'
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor='password'>Password</FieldLabel>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='current-password'
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className='absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground'
                  >
                    {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
                  </button>
                </div>
              </Field>

              {login.isError && (
                <div
                  role='alert'
                  className='flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
                >
                  <AlertCircle className='mt-0.5 size-4 shrink-0' />
                  <span>{login.error.message}</span>
                </div>
              )}

              <Field>
                <Button type='submit' size='lg' disabled={login.isPending} className='w-full'>
                  {login.isPending ? (
                    <>
                      <Loader2 className='size-4 animate-spin' />
                      Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </Field>

              <p className='flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
                <ShieldCheck className='size-3.5' />
                Authorised staff only
              </p>
            </FieldGroup>
          </form>
        </div>

        <Link href='/' className='flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground'>
          <ArrowLeft className='size-4' />
          Back to website
        </Link>
      </div>
    </div>
  );
}
