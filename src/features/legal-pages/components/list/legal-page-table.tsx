'use client';

import { useCan } from '@/contexts/actor-provider';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/admin/dashboard/empty-state';
import { StatusPill, toneForStatus } from '@/components/admin/dashboard/status-pill';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useLegalPageList } from '../../hooks/api/query/use-legal-page-list';
import { useDeleteLegalPage } from '../../hooks/api/mutation/use-delete-legal-page';
import { useReorderLegalPages } from '../../hooks/api/mutation/use-reorder-legal-pages';
import type { LegalPage } from '../../types';

interface LegalPageTableProps {
  initialData: { data: LegalPage[]; total: number };
}

const FILTERS = { page: 1, limit: 50 };

// Rows arrive as Dates from the server render and as ISO strings from the API.
const dateFormat = new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
const formatDate = (value: Date | string | null) => (value ? dateFormat.format(new Date(value)) : '—');

export function LegalPageTable({ initialData }: LegalPageTableProps) {
  const canCreate = useCan({ content: ['create'] });
  const canUpdate = useCan({ content: ['update'] });
  const canDelete = useCan({ content: ['delete'] });
  const { data } = useLegalPageList(FILTERS);
  const rows = data?.data ?? initialData.data;
  const deletePage = useDeleteLegalPage();
  const reorderPages = useReorderLegalPages();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderPages.mutate({ ids });
  };

  const handleDelete = (page: LegalPage) => {
    if (!window.confirm(`Delete "${page.title}"? It disappears from the site and footer. This cannot be undone.`)) {
      return;
    }
    setPendingDeleteId(page.id);
    deletePage.mutate(page.id, { onSettled: () => setPendingDeleteId(null) });
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title='No legal pages yet'
        description='Create a privacy policy, terms or cookie policy. Published pages are linked from the footer.'
        action={
          canCreate ? (
            <Link href={APP_ROUTES.content.legalPages.create} className={cn(buttonVariants({ variant: 'default' }))}>
              Add legal page
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Order</th>
            <th className='px-4 py-2.5 font-medium'>Title</th>
            <th className='px-4 py-2.5 font-medium'>Address</th>
            <th className='px-4 py-2.5 font-medium'>Status</th>
            <th className='px-4 py-2.5 font-medium'>Last updated</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((page, index) => {
            const statusLabel = page.status === 'published' ? 'Published' : 'Draft';
            return (
              <tr key={page.id} className='border-b border-border last:border-0'>
                <td className='px-4 py-2.5'>
                  <div className='flex items-center gap-1'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='size-6'
                      disabled={!canUpdate || index === 0 || reorderPages.isPending}
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
                      disabled={!canUpdate || index === rows.length - 1 || reorderPages.isPending}
                      onClick={() => move(index, 1)}
                      aria-label='Move down'
                    >
                      <ArrowDown className='size-3.5' />
                    </Button>
                  </div>
                </td>
                <td className='px-4 py-2.5 font-medium'>{page.title}</td>
                <td className='px-4 py-2.5 text-muted-foreground'>{`/${page.slug}`}</td>
                <td className='px-4 py-2.5'>
                  <StatusPill tone={toneForStatus(statusLabel)}>{statusLabel}</StatusPill>
                </td>
                <td className='px-4 py-2.5 text-muted-foreground'>{formatDate(page.publishedAt)}</td>
                <td className='px-4 py-2.5'>
                  <div className='flex items-center justify-end gap-1'>
                    {page.status === 'published' && (
                      <a
                        href={`/${page.slug}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={`View ${page.title}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                      >
                        <ExternalLink className='size-4' />
                      </a>
                    )}
                    {canUpdate && (
                      <Link
                        href={APP_ROUTES.content.legalPages.edit(page.id)}
                        aria-label={`Edit ${page.title}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                      >
                        <Pencil className='size-4' />
                      </Link>
                    )}
                    {canDelete && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8 text-destructive hover:text-destructive'
                        disabled={pendingDeleteId === page.id}
                        onClick={() => handleDelete(page)}
                        aria-label={`Delete ${page.title}`}
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
