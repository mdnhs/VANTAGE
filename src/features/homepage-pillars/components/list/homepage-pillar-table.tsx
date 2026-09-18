'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useHomepagePillarList } from '../../hooks/api/query/use-homepage-pillar-list';
import { useUpdateHomepagePillar } from '../../hooks/api/mutation/use-update-homepage-pillar';
import { useDeleteHomepagePillar } from '../../hooks/api/mutation/use-delete-homepage-pillar';
import { useReorderHomepagePillars } from '../../hooks/api/mutation/use-reorder-homepage-pillars';
import type { HomepagePillar } from '../../types';

interface HomepagePillarTableProps {
  initialData: { data: HomepagePillar[]; total: number };
}

const FILTERS = { page: 1, limit: 50 };

// Inline row toggle needs its own mutation instance scoped to that row's id.
function EnabledToggle({ pillar }: { pillar: HomepagePillar }) {
  const updateHomepagePillar = useUpdateHomepagePillar(pillar.id);
  return (
    <Switch
      checked={pillar.isEnabled}
      disabled={updateHomepagePillar.isPending}
      onCheckedChange={(checked) => updateHomepagePillar.mutate({ isEnabled: checked })}
      aria-label={`${pillar.isEnabled ? 'Disable' : 'Enable'} ${pillar.title}`}
    />
  );
}

export function HomepagePillarTable({ initialData }: HomepagePillarTableProps) {
  const { data } = useHomepagePillarList(FILTERS);
  const rows = data?.data ?? initialData.data;
  const deleteHomepagePillar = useDeleteHomepagePillar();
  const reorderHomepagePillars = useReorderHomepagePillars();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderHomepagePillars.mutate({ ids });
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    deleteHomepagePillar.mutate(id, { onSettled: () => setPendingDeleteId(null) });
  };

  if (rows.length === 0) {
    return <p className='text-sm text-muted-foreground'>No homepage pillars yet. Add the first one to get started.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Order</th>
            <th className='px-4 py-2.5 font-medium'>Icon</th>
            <th className='px-4 py-2.5 font-medium'>Title</th>
            <th className='px-4 py-2.5 font-medium'>Description</th>
            <th className='px-4 py-2.5 font-medium'>Enabled</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pillar, index) => (
            <tr key={pillar.id} className='border-b border-border last:border-0'>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === 0 || reorderHomepagePillars.isPending}
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
                    disabled={index === rows.length - 1 || reorderHomepagePillars.isPending}
                    onClick={() => move(index, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </div>
              </td>
              <td className='px-4 py-2.5'>
                <span className='inline-flex items-center rounded border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium'>
                  {pillar.icon}
                </span>
              </td>
              <td className='px-4 py-2.5 font-medium'>{pillar.title}</td>
              <td className='max-w-xs truncate px-4 py-2.5 text-muted-foreground'>{pillar.description}</td>
              <td className='px-4 py-2.5'>
                <EnabledToggle pillar={pillar} />
              </td>
              <td className='px-4 py-2.5'>
                <div className='flex items-center justify-end gap-1'>
                  <Link
                    href={APP_ROUTES.content.homepagePillars.edit(pillar.id)}
                    aria-label={`Edit ${pillar.title}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                  >
                    <Pencil className='size-4' />
                  </Link>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 text-destructive hover:text-destructive'
                    disabled={pendingDeleteId === pillar.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${pillar.title}"? This cannot be undone.`)) {
                        handleDelete(pillar.id);
                      }
                    }}
                    aria-label={`Delete ${pillar.title}`}
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
