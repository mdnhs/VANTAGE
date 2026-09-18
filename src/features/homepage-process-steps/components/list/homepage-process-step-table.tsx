'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Check, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useHomepageProcessStepList } from '../../hooks/api/query/use-homepage-process-step-list';
import { useUpdateHomepageProcessStep } from '../../hooks/api/mutation/use-update-homepage-process-step';
import { useDeleteHomepageProcessStep } from '../../hooks/api/mutation/use-delete-homepage-process-step';
import { useReorderHomepageProcessSteps } from '../../hooks/api/mutation/use-reorder-homepage-process-steps';
import type { HomepageProcessStep } from '../../types';

interface HomepageProcessStepTableProps {
  initialData: { data: HomepageProcessStep[]; total: number };
}

const FILTERS = { page: 1, limit: 50 };

// Inline row toggle needs its own mutation instance scoped to that row's id.
function EnabledToggle({ step }: { step: HomepageProcessStep }) {
  const updateHomepageProcessStep = useUpdateHomepageProcessStep(step.id);
  return (
    <Switch
      checked={step.isEnabled}
      disabled={updateHomepageProcessStep.isPending}
      onCheckedChange={(checked) => updateHomepageProcessStep.mutate({ isEnabled: checked })}
      aria-label={`${step.isEnabled ? 'Disable' : 'Enable'} ${step.title}`}
    />
  );
}

export function HomepageProcessStepTable({ initialData }: HomepageProcessStepTableProps) {
  const { data } = useHomepageProcessStepList(FILTERS);
  const rows = data?.data ?? initialData.data;
  const deleteHomepageProcessStep = useDeleteHomepageProcessStep();
  const reorderHomepageProcessSteps = useReorderHomepageProcessSteps();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderHomepageProcessSteps.mutate({ ids });
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    deleteHomepageProcessStep.mutate(id, { onSettled: () => setPendingDeleteId(null) });
  };

  if (rows.length === 0) {
    return <p className='text-sm text-muted-foreground'>No process steps yet. Add the first one to get started.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Order</th>
            <th className='px-4 py-2.5 font-medium'>Title</th>
            <th className='px-4 py-2.5 font-medium'>Description</th>
            <th className='px-4 py-2.5 font-medium'>Highlighted</th>
            <th className='px-4 py-2.5 font-medium'>Enabled</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((step, index) => (
            <tr key={step.id} className='border-b border-border last:border-0'>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-1'>
                  <span className='mr-1 font-mono text-xs text-muted-foreground'>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === 0 || reorderHomepageProcessSteps.isPending}
                    onClick={() => move(index, -1)}
                    aria-label='Move up'
                  >
                    <ArrowUp className='size-3.5' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === rows.length - 1 || reorderHomepageProcessSteps.isPending}
                    onClick={() => move(index, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </div>
              </td>
              <td className='px-4 py-2.5 font-medium'>{step.title}</td>
              <td className='max-w-xs truncate px-4 py-2.5 text-muted-foreground'>{step.description}</td>
              <td className='px-4 py-2.5'>
                {step.isHighlighted ? <Check className='size-4 text-primary' aria-label='Highlighted' /> : '—'}
              </td>
              <td className='px-4 py-2.5'>
                <EnabledToggle step={step} />
              </td>
              <td className='px-4 py-2.5'>
                <div className='flex items-center justify-end gap-1'>
                  <Link
                    href={APP_ROUTES.content.homepageProcessSteps.edit(step.id)}
                    aria-label={`Edit ${step.title}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                  >
                    <Pencil className='size-4' />
                  </Link>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 text-destructive hover:text-destructive'
                    disabled={pendingDeleteId === step.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${step.title}"? This cannot be undone.`)) {
                        handleDelete(step.id);
                      }
                    }}
                    aria-label={`Delete ${step.title}`}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
