'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { cldUrl } from '@/lib/cloudinary/url';
import { useHomepageCatalogList } from '../../hooks/api/query/use-homepage-catalog-list';
import { useUpdateHomepageCatalog } from '../../hooks/api/mutation/use-update-homepage-catalog';
import { useDeleteHomepageCatalog } from '../../hooks/api/mutation/use-delete-homepage-catalog';
import { useReorderHomepageCatalogs } from '../../hooks/api/mutation/use-reorder-homepage-catalogs';
import type { HomepageCatalog } from '../../types';

interface HomepageCatalogTableProps {
  initialData: { data: HomepageCatalog[]; total: number };
}

const FILTERS = { page: 1, limit: 50 };

function EnabledToggle({ item }: { item: HomepageCatalog }) {
  const updateHomepageCatalog = useUpdateHomepageCatalog(item.id);
  return (
    <Switch
      checked={item.isEnabled}
      disabled={updateHomepageCatalog.isPending}
      onCheckedChange={(checked) => updateHomepageCatalog.mutate({ isEnabled: checked })}
      aria-label={`${item.isEnabled ? 'Disable' : 'Enable'} ${item.title}`}
    />
  );
}

export function HomepageCatalogTable({ initialData }: HomepageCatalogTableProps) {
  const { data } = useHomepageCatalogList(FILTERS);
  const rows = data?.data ?? initialData.data;
  const deleteHomepageCatalog = useDeleteHomepageCatalog();
  const reorderHomepageCatalogs = useReorderHomepageCatalogs();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderHomepageCatalogs.mutate({ ids });
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    deleteHomepageCatalog.mutate(id, { onSettled: () => setPendingDeleteId(null) });
  };

  if (rows.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        No catalog items yet. Add the first one to display in the homepage catalog.
      </p>
    );
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Order</th>
            <th className='px-4 py-2.5 font-medium'>Icon</th>
            <th className='px-4 py-2.5 font-medium'>Title</th>
            <th className='px-4 py-2.5 font-medium'>Badge</th>
            <th className='px-4 py-2.5 font-medium'>Footnote</th>
            <th className='px-4 py-2.5 font-medium'>Description</th>
            <th className='px-4 py-2.5 font-medium'>Enabled</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={item.id} className='border-b border-border last:border-0'>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === 0 || reorderHomepageCatalogs.isPending}
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
                    disabled={index === rows.length - 1 || reorderHomepageCatalogs.isPending}
                    onClick={() => move(index, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </div>
              </td>
              <td className='px-4 py-2.5'>
                {item.iconPublicId ? (
                  <div className='relative size-6 overflow-hidden rounded bg-muted'>
                    <Image
                      src={cldUrl(item.iconPublicId, { width: 48, height: 48 })}
                      alt={item.title}
                      fill
                      className='object-contain'
                    />
                  </div>
                ) : (
                  <span className='inline-flex items-center rounded border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium'>
                    {item.icon}
                  </span>
                )}
              </td>
              <td className='px-4 py-2.5 font-medium'>{item.title}</td>
              <td className='px-4 py-2.5'>
                {item.badge ? (
                  <span className='rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground'>{item.badge}</span>
                ) : (
                  <span className='text-xs text-muted-foreground'>—</span>
                )}
              </td>
              <td className='px-4 py-2.5 text-xs text-muted-foreground'>{item.footnote || '—'}</td>
              <td className='max-w-xs truncate px-4 py-2.5 text-muted-foreground'>{item.description}</td>
              <td className='px-4 py-2.5'>
                <EnabledToggle item={item} />
              </td>
              <td className='px-4 py-2.5'>
                <div className='flex items-center justify-end gap-1'>
                  <Link
                    href={APP_ROUTES.content.homepageCatalogs.edit(item.id)}
                    aria-label={`Edit ${item.title}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                  >
                    <Pencil className='size-4' />
                  </Link>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 text-destructive hover:text-destructive'
                    disabled={pendingDeleteId === item.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
                        handleDelete(item.id);
                      }
                    }}
                    aria-label={`Delete ${item.title}`}
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
