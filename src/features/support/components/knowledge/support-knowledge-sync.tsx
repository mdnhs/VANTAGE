'use client';

import { DatabaseZapIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCan } from '@/contexts/actor-provider';
import { GLOBAL_ACCESS } from '@/lib/content/global-access';

import { useSupportKnowledge, useSyncSupportKnowledge } from '../../hooks/use-support';

const when = (iso: string) => new Date(iso).toLocaleString('en-IE', { dateStyle: 'medium', timeStyle: 'short' });

// Sits under the Live chat AI form. "Sync" copies the website's content into the AI's memory table;
// the AI then reads from that table instead of searching the whole database for every message.
export function SupportKnowledgeSync() {
  const canSync = useCan(GLOBAL_ACCESS.supportBot.update);
  const knowledge = useSupportKnowledge();
  const sync = useSyncSupportKnowledge();
  const data = knowledge.data;
  if (knowledge.isError) {
    return (
      <section aria-label='AI memory' className='flex flex-col items-start gap-2'>
        <h2 className='text-base font-medium'>AI memory</h2>
        <p role='alert' className='text-sm text-destructive'>
          Could not load the AI memory status ({knowledge.error.message}). If this persists, the database may be missing
          the latest migration.
        </p>
      </section>
    );
  }
  if (!data) return null;

  const running = data.status === 'running' || sync.isPending;
  const percent = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;

  return (
    <section aria-label='AI memory' className='flex flex-col items-start gap-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <h2 className='text-base font-medium'>AI memory</h2>
        {data.stale && !running ? <Badge variant='outline'>Sync needed</Badge> : null}
      </div>
      <p className='text-sm text-muted-foreground'>
        Copies your services, prices, contact details, opening hours, process, projects, reviews and page text into the
        AI&apos;s memory. The chat AI answers from this, so sync after you change the website.
      </p>
      <Button variant='outline' disabled={!canSync || running} onClick={() => sync.mutate()}>
        <DatabaseZapIcon data-icon='inline-start' />
        {running ? 'Syncing…' : 'Sync website data'}
      </Button>
      {running ? (
        <div className='flex w-full max-w-md flex-col gap-1.5'>
          <Progress value={percent} aria-label='Sync progress' />
          <p role='status' className='text-sm text-muted-foreground'>
            {data.step ?? 'Starting'} · {percent}%
          </p>
        </div>
      ) : data.status === 'failed' ? (
        <p role='status' className='text-sm text-destructive'>
          {data.error ?? 'The sync failed.'}
        </p>
      ) : data.lastSyncedAt ? (
        <p role='status' className='text-sm text-muted-foreground'>
          Last synced {when(data.lastSyncedAt)} · {data.chunks} pieces of information in memory
        </p>
      ) : (
        <p role='status' className='text-sm text-muted-foreground'>
          Not synced yet. Until then the AI reads your live content directly.
        </p>
      )}
    </section>
  );
}
