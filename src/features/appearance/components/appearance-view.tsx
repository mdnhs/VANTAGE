'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ConflictDialog } from '@/components/admin/autosave/conflict-dialog';
import {
  conflictOf,
  UnsavedChangesError,
  useAutosave,
  type AutosaveState,
} from '@/components/admin/autosave/use-autosave';
import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { FORM_ACTION, PageHeader } from '@/components/admin/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActor, useCan } from '@/contexts/actor-provider';
import { GlobalApiError } from '@/features/globals/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { describeIssue, checkTheme } from '@/lib/theme/checks';
import type { PresetId } from '@/lib/theme/presets';
import type { ThemeConfigValue } from '@/lib/theme/schema';

import { useDiscardTheme } from '../hooks/api/mutation/use-discard-theme';
import { usePublishTheme } from '../hooks/api/mutation/use-publish-theme';
import { useResetTheme } from '../hooks/api/mutation/use-reset-theme';
import { useRestoreTheme } from '../hooks/api/mutation/use-restore-theme';
import { useTheme } from '../hooks/api/query/use-theme';
import { previewHref, saveThemeDraft } from '../services/api';
import type { ThemeAdminDoc } from '../types';
import { themeKeys } from '../utils/query-keys';
import { AdminControls } from './admin-controls';
import { AdminPreview, useLiveAdmin } from './admin-preview';
import { BrandAssets } from './brand-assets';
import { ContrastPanel } from './contrast-panel';
import { ResetDialog } from './reset-dialog';
import { SiteControls } from './site-controls';
import { SitePreviewPane } from './site-preview-pane';
import { ThemeHistory } from './theme-history';

const BLOCKED = 'Publishing is blocked until every pair passes.';

// The loader hands the editor a copy fetched for this mount; Review and a
// stale publish remount it on the server's version.
export function AppearanceView({
  autosaveDelay,
}: {
  // Test-only: the debounce before a draft is saved.
  autosaveDelay?: number;
}) {
  const query = useTheme();
  const [generation, setGeneration] = useState(0);
  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
    setGeneration((g) => g + 1);
  }, [refetch]);
  if (query.isPending || (query.isSuccess && !query.isFetchedAfterMount)) return <CardSkeleton />;
  if (query.isError) {
    return (
      <div role='alert' className='flex flex-col items-start gap-3'>
        <p>{query.error.message}</p>
        <Button variant='outline' onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return <Editor key={generation} doc={query.data} reload={reload} delay={autosaveDelay} />;
}

function statusText(state: AutosaveState, hasDraft: boolean) {
  switch (state.status) {
    case 'saving':
      return 'Saving…';
    case 'pending':
      return 'Unsaved changes';
    case 'error':
      return "Couldn't save";
    case 'conflict':
      return 'Changed by someone else';
    case 'saved':
      return 'Draft saved';
    default:
      return hasDraft ? 'Draft saved' : 'No draft changes';
  }
}

function Editor({ doc, reload, delay }: { doc: ThemeAdminDoc; reload(): Promise<void>; delay?: number }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  // View-as is read-only: the API refuses it, so the controls do not offer it.
  const viewingAs = Boolean(useActor().impersonatedBy);
  const canUpdate = useCan({ appearance: ['update'] }) && !viewingAs;
  const canPublish = useCan({ appearance: ['publish'] }) && !viewingAs;
  const [draft, setDraft] = useState<ThemeConfigValue>(doc.draft);
  const [tab, setTab] = useState('site');
  const [serverError, setServerError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<object | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const autosave = useAutosave<ThemeConfigValue>({
    version: doc.version,
    delay,
    save: async (value, version, options) => {
      const next = await saveThemeDraft({ version, draft: value }, options);
      queryClient.setQueryData(themeKeys.detail(), next);
      return next;
    },
  });
  const { state, exclusive } = autosave;
  // The site preview reloads on a save, and on anything else that changes what it should show.
  const [bumps, setBumps] = useState(0);
  // A save stamps savedAt; adopt and publish bump the counter. Either changes the key.
  const previewKey = (state.savedAt ?? 0) + bumps;
  const bumpPreview = () => setBumps((n) => n + 1);
  useLiveAdmin(draft.admin);

  const publish = usePublishTheme();
  const discard = useDiscardTheme();
  const reset = useResetTheme();
  const restore = useRestoreTheme();

  const update = (next: ThemeConfigValue) => {
    if (!canUpdate) return;
    setDraft(next);
    setServerError(null);
    autosave.schedule(next);
  };

  // Discard, reset and restore answer with the new draft.
  const adopt = (res: ThemeAdminDoc) => {
    autosave.reset(res.version);
    bumpPreview();
    setDraft(res.draft);
    setServerError(null);
  };
  const replaceWithServer = () => {
    autosave.reset(autosave.getVersion());
    void reload();
  };
  const onError = (error: unknown) => {
    if (conflictOf(error)) {
      toast.error('Changed by someone else. Their version is loaded.');
      return replaceWithServer();
    }
    if (error instanceof GlobalApiError && error.code === 'VALIDATION_ERROR') return setServerError(error.message);
    toast.error(error instanceof Error ? error.message : 'Something went wrong');
  };
  // Every version-carrying request takes the save queue's place, so it never
  // races an autosave on the same version.
  const attempt = async <R,>(request: (version: number) => Promise<R>, onDone: (res: R) => void) => {
    try {
      onDone(await exclusive(request));
    } catch (error) {
      if (error instanceof UnsavedChangesError) return void toast.error(error.message);
      onError(error);
    }
  };

  const onPublish = () =>
    attempt(
      (version) => publish.mutateAsync({ version }),
      (res) => {
        autosave.reset(res.version);
        bumpPreview();
        setServerError(null);
        toast.success('Theme published');
        // The admin layout reads the published theme on the server.
        router.refresh();
      },
    );
  const onDiscard = () =>
    attempt(
      (version) => discard.mutateAsync({ version }),
      (res) => adopt(res),
    );
  const onReset = (input: { preset: PresetId; scope: 'site' | 'admin' | 'both' }) =>
    attempt(
      (version) => reset.mutateAsync({ version, ...input }),
      (res) => {
        adopt(res);
        setResetOpen(false);
      },
    );
  const onRestore = (revisionId: string) =>
    attempt(
      (version) => restore.mutateAsync({ revisionId, version }),
      (res) => {
        adopt(res);
        toast.success('Loaded into the draft');
      },
    );

  // A full navigation (the endpoint sets the draft-mode cookie and redirects).
  const previewOnSite = async () => {
    await autosave.flush();
    window.open(previewHref('/'), '_blank', 'noopener');
  };

  const issues = checkTheme(draft);
  const conflictOpen = state.status === 'conflict' && state.conflict !== null && state.conflict !== dismissed;
  const busy = publish.isPending || discard.isPending || reset.isPending || restore.isPending;

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader
        title='Appearance'
        description={
          <span role='status' aria-live='polite'>
            {state.status === 'conflict' ? (
              // Dismissing the dialog chooses nothing; this brings it back.
              <button type='button' className='underline underline-offset-2' onClick={() => setDismissed(null)}>
                {statusText(state, doc.hasDraft)}
              </button>
            ) : (
              statusText(state, doc.hasDraft)
            )}
            {state.status === 'error' && state.error ? `: ${state.error}` : ''}
          </span>
        }
        actions={
          <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
            <Button variant='outline' className={FORM_ACTION} onClick={() => void previewOnSite()}>
              Preview on site
            </Button>
            <Button
              variant='outline'
              className={FORM_ACTION}
              disabled={!canUpdate || !doc.hasDraft || busy}
              onClick={() => void onDiscard()}
            >
              Discard draft
            </Button>
            <Button
              variant='outline'
              className={FORM_ACTION}
              disabled={!canUpdate || busy}
              onClick={() => setResetOpen(true)}
            >
              Reset to preset…
            </Button>
            {canPublish ? (
              <Button
                className={FORM_ACTION}
                disabled={
                  busy || state.status === 'saving' || issues.length > 0 || (!doc.hasDraft && state.status === 'idle')
                }
                onClick={() => void onPublish()}
              >
                {publish.isPending ? <Spinner data-icon='inline-start' /> : null}
                Publish
              </Button>
            ) : null}
          </div>
        }
      />

      {issues.length > 0 || serverError ? (
        <div role='alert' className='flex flex-col gap-1 rounded-xl bg-danger-soft p-4 text-sm text-danger'>
          <p className='font-semibold'>{BLOCKED}</p>
          <p>{serverError ?? describeIssue(issues[0]!)}</p>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={(next) => setTab(String(next))}>
        <TabsList>
          <TabsTrigger value='site'>Site</TabsTrigger>
          <TabsTrigger value='admin'>Admin</TabsTrigger>
        </TabsList>
        <TabsContent value='site' className='pt-2'>
          <div className='grid gap-5 xl:grid-cols-2'>
            <fieldset disabled={!canUpdate} className='flex min-w-0 flex-col gap-5'>
              <SiteControls draft={draft} update={update} />
              <ContrastPanel config={draft} scope='site' onChange={update} />
            </fieldset>
            <SitePreviewPane path='/' refreshKey={previewKey} />
          </div>
        </TabsContent>
        <TabsContent value='admin' className='pt-2'>
          <div className='grid gap-5 xl:grid-cols-2'>
            <fieldset disabled={!canUpdate} className='flex min-w-0 flex-col gap-5'>
              <AdminControls draft={draft} update={update} />
              <ContrastPanel config={draft} scope='admin' onChange={update} />
            </fieldset>
            <AdminPreview />
          </div>
        </TabsContent>
      </Tabs>

      <div className='grid gap-5 xl:grid-cols-2'>
        <BrandAssets />
        <ThemeHistory canRestore={canUpdate && !busy} onLoad={(rev) => void onRestore(rev)} />
      </div>

      <ResetDialog
        open={resetOpen}
        pending={reset.isPending}
        onOpenChange={setResetOpen}
        onConfirm={(input) => void onReset(input)}
      />
      <ConflictDialog
        conflict={conflictOpen ? state.conflict : null}
        onDismiss={() => setDismissed(state.conflict)}
        onReview={replaceWithServer}
        onOverwrite={() => void autosave.overwrite()}
      />
    </div>
  );
}
