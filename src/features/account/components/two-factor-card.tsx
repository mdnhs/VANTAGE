'use client';

import { CopyIcon, DownloadIcon, ShieldCheckIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useActor } from '@/contexts/actor-provider';
import { authRequest } from '@/features/auth/lib/auth-errors';
import { authClient } from '@/lib/auth-client';
import { isAdminRole } from '@/lib/auth/permissions';
import { APP_ROUTES } from '@/lib/routes/app-routes';

type Mode = 'codes' | 'disable' | null;

export function TwoFactorCard() {
  const { twoFactorEnabled, roles } = useActor();
  // Optional for every role; admin roles are only told why it matters more.
  const recommended = isAdminRole(roles);
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  const close = () => {
    setMode(null);
    setPassword('');
    setError(null);
    setCodes(null);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    let outcome: Awaited<ReturnType<typeof authRequest<unknown>>>;
    try {
      outcome = await authRequest<unknown>(() =>
        mode === 'codes'
          ? authClient.twoFactor.generateBackupCodes({ password })
          : authClient.twoFactor.disable({ password }),
      );
    } finally {
      setBusy(false);
    }
    const { data, failure } = outcome;
    if (failure) {
      // A rejection here is the password check; outages and limits get their own copy.
      setError(failure.kind === 'rejected' ? "That password didn't work" : failure.message);
      return;
    }
    if (mode === 'codes') {
      setCodes((data as unknown as { backupCodes: string[] }).backupCodes);
      setPassword('');
      return;
    }
    toast.success('Two-factor authentication is off');
    close();
    router.refresh();
  }

  const text = codes?.join('\n') ?? '';

  if (!twoFactorEnabled) {
    return (
      <div className='flex flex-col items-start gap-4'>
        <Badge variant='secondary'>Off</Badge>
        <p className='text-sm text-muted-foreground'>
          Turn on two-factor authentication: a code from an authenticator app is asked for when you sign in on a new
          device.
        </p>
        {recommended ? (
          <p className='text-sm text-muted-foreground'>
            Strongly recommended for your role, which can change who has access.
          </p>
        ) : null}
        <Link href={APP_ROUTES.auth.twoFactorSetup} className={buttonVariants()}>
          <ShieldCheckIcon data-icon='inline-start' />
          Set up two-factor
        </Link>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-start gap-4'>
      <Badge>On</Badge>
      <p className='text-sm text-muted-foreground'>
        A code from an authenticator app is asked for when you sign in on a new device.
      </p>
      <div className='flex flex-wrap gap-2'>
        <Button variant='outline' onClick={() => setMode('codes')}>
          New backup codes
        </Button>
        <Button variant='ghost' onClick={() => setMode('disable')}>
          Turn off
        </Button>
      </div>
      <Dialog open={mode !== null} onOpenChange={(open) => (open ? null : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'codes' ? 'New backup codes' : 'Turn off two-factor'}</DialogTitle>
            <DialogDescription>
              {mode === 'codes'
                ? 'Your old backup codes stop working. Each new code works once.'
                : recommended
                  ? 'Signing in will only ask for your password. Your role can change who has access, so keeping it on is strongly recommended.'
                  : 'Signing in will only ask for your password.'}
            </DialogDescription>
          </DialogHeader>
          {codes ? (
            <div className='flex flex-col gap-3'>
              <ul className='grid grid-cols-2 gap-1 font-mono text-sm'>
                {codes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => navigator.clipboard.writeText(text).then(() => toast.success('Copied'))}
                >
                  <CopyIcon data-icon='inline-start' /> Copy
                </Button>
                <a
                  className={buttonVariants({ variant: 'outline' })}
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
                  download='vantage-backup-codes.txt'
                >
                  <DownloadIcon data-icon='inline-start' /> Download
                </a>
                <Button onClick={close}>I&apos;ve saved them</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={submit} className='flex flex-col gap-4'>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor='two-factor-password'>Password</FieldLabel>
                <Input
                  id='two-factor-password'
                  type='password'
                  autoComplete='current-password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error ? <FieldError>{error}</FieldError> : null}
              </Field>
              <DialogFooter>
                <Button type='submit' disabled={busy || !password}>
                  {mode === 'codes' ? 'Generate' : 'Turn off two-factor'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
