'use client';

import { PageHeader } from '@/components/admin/dashboard/page-header';
import { SectionTabs } from '@/components/admin/section-tabs';
import { GLOBAL_LABELS, type EditableGlobalKey } from '@/lib/content/global-access';

import { GlobalForm } from './global-form';

// One page, one or more globals. A single key is one form; several keys are
// tabs, each its own form with its own Save and History (MK pattern).
export function GlobalEditor({
  title,
  keys,
  onValuesChange,
  embedded = false,
}: {
  title: string;
  keys: readonly EditableGlobalKey[];
  // Single-key editors only: live values for previews.
  onValuesChange?: (values: unknown) => void;
  // Inside a page that already has its own header (e.g. a tab of a website page).
  embedded?: boolean;
}) {
  return (
    <div className='flex flex-col gap-6'>
      {!embedded && <PageHeader title={title} description='Changes go live as soon as you save.' />}
      {keys.length === 1 ? (
        <GlobalForm settingKey={keys[0]!} onValuesChange={onValuesChange} />
      ) : (
        // Each document is its own form with its own Save and History, so only the open one is mounted.
        <SectionTabs
          keepMounted={false}
          tabs={keys.map((key) => ({
            value: key,
            label: GLOBAL_LABELS[key],
            content: <GlobalForm settingKey={key} />,
          }))}
        />
      )}
    </div>
  );
}
