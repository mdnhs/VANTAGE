'use client';

import { toast } from 'sonner';

import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { DashboardCard } from '@/components/admin/dashboard/dashboard-card';
import type { FormField } from '@/components/admin/schema-form/to-fields';
import { ImageWidget } from '@/components/admin/schema-form/widgets/image-widget';
import { Button } from '@/components/ui/button';
import { useActor, useCan } from '@/contexts/actor-provider';
import { useSaveGlobal } from '@/features/globals/hooks/api/mutation/use-save-global';
import { useGlobal } from '@/features/globals/hooks/api/query/use-global';
import { CONFLICT_MESSAGE } from '@/features/globals/lib/submit-result';
import { GLOBAL_ACCESS } from '@/lib/content/global-access';
import type { ImageRef } from '@/lib/content/image-ref';

type Key = 'logo' | 'favicon';

const FIELDS: Record<Key, FormField> = {
  logo: { name: 'logo', label: 'Logo', widget: 'image', required: false, nullable: true, node: {} },
  favicon: {
    name: 'favicon',
    label: 'Favicon',
    widget: 'image',
    required: false,
    nullable: true,
    description: 'Square PNG, JPEG or WebP, at least 512 × 512. SVG uploads are not accepted.',
    node: {},
  },
};

// The logo and favicon live in the `site` global (Identity), so they go live
// as soon as they are saved; they are not part of the theme draft. Uses the
// schema-form image widget, so Phase 5's media picker replaces it here too.
export function BrandAssets() {
  const doc = useGlobal('site');
  const { save, isPending } = useSaveGlobal('site');
  const viewingAs = Boolean(useActor().impersonatedBy);
  const canUpdate = useCan(GLOBAL_ACCESS.site.update) && !viewingAs;
  if (doc.isError) {
    return (
      <DashboardCard title='Brand images'>
        <div role='alert' className='flex flex-col items-start gap-3 text-sm'>
          <p>{doc.error.message}</p>
          <Button variant='outline' onClick={() => void doc.refetch()}>
            Try again
          </Button>
        </div>
      </DashboardCard>
    );
  }
  if (!doc.data) return <CardSkeleton />;
  const { version } = doc.data;
  const value = doc.data.value as Record<Key, ImageRef | undefined>;

  const change = async (key: Key, next: ImageRef | undefined) => {
    const result = await save({ version, value: { ...value, [key]: next ?? null } });
    if (result.saved) return void toast.success('Brand images saved');
    if (result.conflict) return void toast.error(CONFLICT_MESSAGE);
    toast.error((result && 'formError' in result ? result.formError : undefined) ?? 'Could not save the brand images');
  };

  return (
    <DashboardCard title='Brand images'>
      <fieldset disabled={!canUpdate || isPending} className='flex min-w-0 flex-col gap-5'>
        {(['logo', 'favicon'] as const).map((key) => (
          <ImageWidget
            key={`${key}-${version}`}
            field={FIELDS[key]}
            value={value[key] ?? null}
            onChange={(next) => void change(key, next)}
          />
        ))}
      </fieldset>
    </DashboardCard>
  );
}
