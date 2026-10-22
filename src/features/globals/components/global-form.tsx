'use client';

import { HistoryIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { SchemaForm } from '@/components/admin/schema-form/schema-form';
import { Button } from '@/components/ui/button';
import { useCan } from '@/contexts/actor-provider';
import { GLOBAL_ACCESS, GLOBAL_LABELS, type EditableGlobalKey } from '@/lib/content/global-access';
import { GLOBALS } from '@/lib/content/globals';

import { GLOBAL_FIELD_UI } from '../global-ui';
import { useSaveGlobal } from '../hooks/api/mutation/use-save-global';
import { useGlobal } from '../hooks/api/query/use-global';
import { CONFLICT_MESSAGE } from '../lib/submit-result';
import { GlobalHistory } from './global-history';

// Globals go live on save, guarded by version. The form is keyed by version so
// a save, a restore or a conflict reload shows exactly what is stored.
export function GlobalForm({
  settingKey,
  onValuesChange,
}: {
  settingKey: EditableGlobalKey;
  // Single-key editors only: live values for previews.
  onValuesChange?: (values: unknown) => void;
}) {
  const doc = useGlobal(settingKey);
  const { save } = useSaveGlobal(settingKey);
  const canUpdate = useCan(GLOBAL_ACCESS[settingKey].update);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Held here, outside the version-keyed SchemaForm: the conflict reload
  // remounts the form, which would drop an error set on the old instance.
  const [conflict, setConflict] = useState(false);
  const label = GLOBAL_LABELS[settingKey];

  if (doc.isError) {
    return (
      <div role='alert' className='flex flex-col items-start gap-3'>
        <p>{doc.error.message}</p>
        <Button variant='outline' onClick={() => void doc.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (!doc.data) return <CardSkeleton />;
  const { version, value } = doc.data;

  return (
    <section aria-label={label} className='flex flex-col gap-4'>
      <Button variant='outline' className='self-end' onClick={() => setHistoryOpen(true)}>
        <HistoryIcon data-icon='inline-start' />
        History
      </Button>
      {conflict ? (
        <p role='alert' className='rounded-xl border border-destructive/40 p-3 text-sm text-destructive'>
          {CONFLICT_MESSAGE}
        </p>
      ) : null}
      {/* Read-only for roles that can read but not update; the API still refuses their PUT. */}
      <fieldset disabled={!canUpdate} className='min-w-0'>
        <SchemaForm
          key={version}
          schema={GLOBALS[settingKey]}
          overrides={GLOBAL_FIELD_UI[settingKey]}
          defaultValues={value as never}
          submitLabel={`Save ${label.toLowerCase()}`}
          readOnly={!canUpdate}
          onValuesChange={onValuesChange}
          onSubmit={async (next) => {
            setConflict(false);
            const result = await save({ version, value: next });
            if (result.saved) {
              toast.success(`${label} saved`);
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
