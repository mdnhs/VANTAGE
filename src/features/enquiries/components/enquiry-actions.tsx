'use client';

import { Download, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useActor, useCan } from '@/contexts/actor-provider';

import { downloadEnquiryCsv } from '../services/api';
import { PrivacyRequestDialog } from './privacy-request-dialog';

// Header actions of the two inbox pages: CSV export and privacy requests, each shown only to
// people who may use it. The API checks the same rights.
export function EnquiryActions({ type, status }: { type: 'quotes' | 'contacts'; status?: string }) {
  const actor = useActor();
  const canExport = useCan(type === 'quotes' ? { quote: ['export'] } : { contact: ['export'] });
  const canPrivacy = useCan({ quote: ['export'], contact: ['export'] });
  const canErase = useCan({ quote: ['delete'], contact: ['delete'] }) && !actor.impersonatedBy;
  const [busy, setBusy] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  async function exportCsv() {
    setBusy(true);
    try {
      await downloadEnquiryCsv(type, status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {canExport && (
        <Button type='button' variant='outline' size='sm' disabled={busy} onClick={exportCsv}>
          <Download className='size-3.5' />
          Export CSV
        </Button>
      )}
      {canPrivacy && (
        <>
          <Button type='button' variant='outline' size='sm' onClick={() => setPrivacyOpen(true)}>
            <Shield className='size-3.5' />
            Privacy request
          </Button>
          <PrivacyRequestDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} canErase={canErase} />
        </>
      )}
    </>
  );
}
