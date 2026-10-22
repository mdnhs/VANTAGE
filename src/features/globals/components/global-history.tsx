'use client';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { GLOBAL_LABELS, type EditableGlobalKey } from '@/lib/content/global-access';

import { useRestoreGlobal } from '../hooks/api/mutation/use-restore-global';
import { useGlobalRevisions } from '../hooks/api/query/use-global-revisions';
import { isConflict } from '../lib/submit-result';
import { revisionSummary } from '../lib/revisions';

// Each save is a revision. Restoring saves it as the newest version.
export function GlobalHistory({
  settingKey,
  open,
  onOpenChange,
  version,
  canRestore,
}: {
  settingKey: EditableGlobalKey;
  open: boolean;
  onOpenChange(open: boolean): void;
  version: number;
  canRestore: boolean;
}) {
  const list = useGlobalRevisions(settingKey, open);
  const restore = useRestoreGlobal(settingKey);
  const items = list.data ?? [];
  // "When" is measured at the moment the list was fetched.
  const now = list.dataUpdatedAt;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full gap-0 sm:max-w-md'>
        <SheetHeader className='border-b p-5'>
          <SheetTitle className='text-lg font-semibold'>{GLOBAL_LABELS[settingKey]} history</SheetTitle>
          <SheetDescription>Every save is kept (the latest 20). Pick one to bring it back.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto p-5'>
          {list.isPending ? (
            <div className='flex flex-col gap-3' aria-hidden>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className='h-14 rounded-xl bg-skeleton' />
              ))}
            </div>
          ) : list.isError ? (
            <div role='alert' className='flex flex-col items-start gap-3'>
              <p>{list.error.message}</p>
              <Button variant='outline' onClick={() => void list.refetch()}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className='rounded-2xl border border-dashed p-8 text-center text-muted-foreground'>Nothing saved yet.</p>
          ) : (
            <ol className='flex flex-col gap-3'>
              {items.map((item) => (
                <li
                  key={item.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3'
                >
                  <p className='min-w-0 text-sm'>{revisionSummary(item, now)}</p>
                  {canRestore ? (
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={restore.isPending}
                      onClick={() =>
                        restore.mutate(
                          { revisionId: item.id, version },
                          {
                            onSuccess: () => {
                              toast.success(`Restored version ${item.version}`);
                              onOpenChange(false);
                            },
                            onError: (error) => {
                              toast.error(
                                isConflict(error)
                                  ? 'Someone else saved a moment ago. Their version is loaded; try again.'
                                  : error.message,
                              );
                            },
                          },
                        )
                      }
                    >
                      {restore.isPending && restore.variables?.revisionId === item.id ? (
                        <Spinner data-icon='inline-start' />
                      ) : null}
                      Restore
                    </Button>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
