'use client';

import { HistoryIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useAutosave } from '@/components/admin/autosave/use-autosave';
import { SchemaForm } from '@/components/admin/schema-form/schema-form';
import { toFields } from '@/components/admin/schema-form/to-fields';
import { SitePreviewPane } from '@/components/admin/site-preview-pane';
import { Button } from '@/components/ui/button';
import { GLOBAL_LABELS, type PreviewableGlobalKey } from '@/lib/content/global-access';
import { GLOBALS } from '@/lib/content/globals';
import { PUBLIC_PAGE_LIST } from '@/lib/seo/public-pages';

import { GLOBAL_FIELD_UI } from '../global-ui';
import { useSaveGlobal } from '../hooks/api/mutation/use-save-global';
import { CONFLICT_MESSAGE } from '../lib/submit-result';
import { discardGlobalDraft, saveGlobalDraft } from '../services/api';
import type { GlobalDoc } from '../types';
import { globalKeys } from '../utils/query-keys';
import { GlobalHistory } from './global-history';

const STATUS: Partial<Record<string, string>> = {
  pending: 'Unsaved changes…',
  saving: 'Saving draft…',
  saved: 'Draft saved — only you see it in the preview',
  error: 'Could not save the draft. Retrying…',
};

// Website page copy: edits save as a draft on their own (debounced, no version bump) and the
// preview beside the form shows them; Publish puts the form live through the normal
// version-guarded save, which also clears the draft. Visitors never see a draft.
export function DraftGlobalForm({
  settingKey,
  doc,
  canUpdate,
}: {
  settingKey: PreviewableGlobalKey;
  doc: GlobalDoc;
  canUpdate: boolean;
}) {
  const queryClient = useQueryClient();
  const { save } = useSaveGlobal(settingKey);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [hasDraft, setHasDraft] = useState(doc.draft != null);
  // Bumped after every draft save, publish and discard: the preview re-enters draft mode.
  const [previewKey, setPreviewKey] = useState<number | null>(null);
  // After a discard the form restarts from the published copy. That copy (`doc.value`) never
  // changes on a draft save, so no refetch is needed — and none is awaited, because the
  // query's new data reaches this component only after a later render.
  const [discarded, setDiscarded] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const label = GLOBAL_LABELS[settingKey];
  const path = PUBLIC_PAGE_LIST.find((page) => page.pageKey === settingKey)?.path ?? '/';
  const { version, value } = doc;
  const formRef = useRef<HTMLFieldSetElement>(null);
  // The page's sections in the order they appear on the site, for the outline above the form.
  const sections = useMemo(
    () =>
      toFields(GLOBALS[settingKey], GLOBAL_FIELD_UI[settingKey])
        .filter((field) => field.widget === 'group' || field.widget === 'list')
        .map((field) => ({ name: field.name, label: field.label })),
    [settingKey],
  );
  const jumpTo = (name: string) =>
    formRef.current
      ?.querySelector(`[data-section="${CSS.escape(name)}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const autosave = useAutosave<unknown>({
    version,
    save: async (draft, current, options) => {
      await saveGlobalDraft(settingKey, draft, options);
      setHasDraft(true);
      setPreviewKey(Date.now());
      return { version: current };
    },
    delay: 1000,
  });

  async function discard() {
    await autosave.flush();
    await discardGlobalDraft(settingKey);
    autosave.reset(version);
    setHasDraft(false);
    setDiscarded(true);
    setFormKey((n) => n + 1);
    void queryClient.invalidateQueries({ queryKey: globalKeys.detail(settingKey) });
    setPreviewKey(Date.now());
    toast.success('Changes discarded');
  }

  const status = canUpdate ? STATUS[autosave.state.status] : undefined;

  return (
    <section aria-label={label} className='grid gap-5 xl:grid-cols-2'>
      <div className='flex min-w-0 flex-col gap-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p aria-live='polite' className='text-sm text-muted-foreground'>
            {status ?? 'Edits appear in the preview; visitors see them after you publish.'}
          </p>
          <Button variant='outline' onClick={() => setHistoryOpen(true)}>
            <HistoryIcon data-icon='inline-start' />
            History
          </Button>
        </div>
        {hasDraft ? (
          <div
            role='status'
            className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning-soft p-3 text-sm'
          >
            <span>You have changes that are not live yet. Publish them, or discard to go back.</span>
            {canUpdate ? (
              <Button variant='outline' size='sm' onClick={() => void discard()}>
                Discard changes
              </Button>
            ) : null}
          </div>
        ) : null}
        {conflict ? (
          <p role='alert' className='rounded-xl border border-destructive/40 p-3 text-sm text-destructive'>
            {CONFLICT_MESSAGE}
          </p>
        ) : null}
        {sections.length > 1 ? (
          <nav aria-label='Sections on this page' className='flex flex-wrap items-center gap-2'>
            <span className='text-sm text-muted-foreground'>On this page:</span>
            {sections.map((section) => (
              <Button key={section.name} type='button' variant='outline' size='sm' onClick={() => jumpTo(section.name)}>
                {section.label}
              </Button>
            ))}
          </nav>
        ) : null}
        {/* Read-only for roles that can read but not update; the API still refuses their writes. */}
        <fieldset ref={formRef} disabled={!canUpdate} className='min-w-0'>
          <SchemaForm
            key={`${version}:${formKey}`}
            schema={GLOBALS[settingKey]}
            overrides={GLOBAL_FIELD_UI[settingKey]}
            defaultValues={(discarded ? value : (doc.draft ?? value)) as never}
            submitLabel='Publish changes'
            readOnly={!canUpdate}
            onValuesChange={canUpdate ? (next) => autosave.schedule(next) : undefined}
            onSubmit={async (next) => {
              setConflict(false);
              // A draft still in flight must not land after the publish and resurrect itself.
              await autosave.flush();
              const result = await save({ version, value: next });
              if (result.saved) {
                autosave.reset(version);
                setHasDraft(false);
                setPreviewKey(Date.now());
                toast.success(`${label} published`);
                return;
              }
              if (result.conflict) {
                setConflict(true);
                return;
              }
              return result;
            }}
          />
        </fieldset>
      </div>
      <div className='min-w-0 xl:sticky xl:top-4 xl:h-[calc(100dvh-2rem)] xl:self-start'>
        <SitePreviewPane path={path} refreshKey={previewKey} />
      </div>
      <GlobalHistory
        settingKey={settingKey}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        version={version}
        canRestore={canUpdate}
      />
    </section>
  );
}
