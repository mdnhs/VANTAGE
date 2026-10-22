'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { downloadPrivacyData, erasePrivacyData, type ErasureResult } from '../services/api';

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');

// Finds everything held for one email address across quotes and contact messages: download it, or
// erase it. Quotes with invoice or payment records are kept and listed.
export function PrivacyRequestDialog({
  open,
  onClose,
  canErase,
}: {
  open: boolean;
  onClose(): void;
  // Both delete rights and not View-as; the API enforces the same.
  canErase: boolean;
}) {
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ErasureResult | null>(null);

  const address = email.trim().toLowerCase();
  const confirmed = address.length > 0 && confirm.trim().toLowerCase() === address;

  function close() {
    setEmail('');
    setConfirm('');
    setResult(null);
    onClose();
  }

  async function download() {
    setBusy(true);
    try {
      await downloadPrivacyData(address);
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function erase() {
    setBusy(true);
    try {
      setResult(await erasePrivacyData(address));
      setConfirm('');
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Privacy request</DialogTitle>
          <DialogDescription>
            Download or erase everything held for one email address in quotes and contact messages.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <div className='space-y-1.5'>
            <Label htmlFor='privacy-email'>Email address</Label>
            <Input
              id='privacy-email'
              type='email'
              autoComplete='off'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setConfirm('');
                setResult(null);
              }}
            />
          </div>
          {canErase && (
            <div className='space-y-1.5'>
              <Label htmlFor='privacy-confirm'>Retype the email to enable erasing</Label>
              <Input
                id='privacy-confirm'
                type='email'
                autoComplete='off'
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <p className='text-xs text-muted-foreground'>Erasing cannot be undone.</p>
            </div>
          )}
          {result && (
            <div className='rounded-lg border border-border p-3 text-sm' role='status'>
              <p>
                Erased {result.deleted.quotes} {result.deleted.quotes === 1 ? 'quote' : 'quotes'} and{' '}
                {result.deleted.contacts} {result.deleted.contacts === 1 ? 'contact message' : 'contact messages'}.
              </p>
              {result.kept.length > 0 && (
                <ul className='mt-2 space-y-1 text-muted-foreground'>
                  {result.kept.map((k) => (
                    <li key={k.id}>
                      Quote {k.id.slice(0, 8)} - Kept: invoice or payment records (6-year accounting rule)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={close}>
            Close
          </Button>
          <Button type='button' variant='outline' disabled={busy || !address} onClick={download}>
            Download data
          </Button>
          {canErase && (
            <Button type='button' variant='destructive' disabled={busy || !confirmed} onClick={erase}>
              Erase data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
