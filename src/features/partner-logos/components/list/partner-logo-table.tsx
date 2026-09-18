'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { cldUrl } from '@/lib/cloudinary/url';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { usePartnerLogoList } from '../../hooks/api/query/use-partner-logo-list';
import { useUpdatePartnerLogo } from '../../hooks/api/mutation/use-update-partner-logo';
import { useDeletePartnerLogo } from '../../hooks/api/mutation/use-delete-partner-logo';
import { useReorderPartnerLogos } from '../../hooks/api/mutation/use-reorder-partner-logos';
import type { PartnerLogo } from '../../types';

interface PartnerLogoTableProps {
  initialData: { data: PartnerLogo[]; total: number };
}

const FILTERS = { page: 1, limit: 50 };

// Inline row toggle needs its own mutation instance scoped to that row's id.
function EnabledToggle({ partnerLogo }: { partnerLogo: PartnerLogo }) {
  const updatePartnerLogo = useUpdatePartnerLogo(partnerLogo.id);
  return (
    <Switch
      checked={partnerLogo.isEnabled}
      disabled={updatePartnerLogo.isPending}
      onCheckedChange={(checked) => updatePartnerLogo.mutate({ isEnabled: checked })}
      aria-label={`${partnerLogo.isEnabled ? 'Disable' : 'Enable'} ${partnerLogo.companyName}`}
    />
  );
}

export function PartnerLogoTable({ initialData }: PartnerLogoTableProps) {
  const { data } = usePartnerLogoList(FILTERS);
  const rows = data?.data ?? initialData.data;
  const deletePartnerLogo = useDeletePartnerLogo();
  const reorderPartnerLogos = useReorderPartnerLogos();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderPartnerLogos.mutate({ ids });
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    deletePartnerLogo.mutate(id, { onSettled: () => setPendingDeleteId(null) });
  };

  if (rows.length === 0) {
    return <p className='text-sm text-muted-foreground'>No partner logos yet. Add the first one to get started.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Order</th>
            <th className='px-4 py-2.5 font-medium'>Logo</th>
            <th className='px-4 py-2.5 font-medium'>Company</th>
            <th className='px-4 py-2.5 font-medium'>Website</th>
            <th className='px-4 py-2.5 font-medium'>Enabled</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((partnerLogo, index) => (
            <tr key={partnerLogo.id} className='border-b border-border last:border-0'>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === 0 || reorderPartnerLogos.isPending}
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
                    disabled={index === rows.length - 1 || reorderPartnerLogos.isPending}
                    onClick={() => move(index, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </div>
              </td>
              <td className='px-4 py-2.5'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cldUrl(partnerLogo.logoPublicId, { width: 96, height: 96, crop: 'fit' })}
                  alt={partnerLogo.companyName}
                  className='h-10 w-16 rounded border border-border bg-white/5 object-contain p-1'
                />
              </td>
              <td className='px-4 py-2.5 font-medium'>{partnerLogo.companyName}</td>
              <td className='px-4 py-2.5 text-muted-foreground'>
                {partnerLogo.websiteUrl ? (
                  <a
                    href={partnerLogo.websiteUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 hover:text-foreground'
                  >
                    {partnerLogo.websiteUrl.replace(/^https?:\/\//, '')}
                    <ExternalLink className='size-3' />
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className='px-4 py-2.5'>
                <EnabledToggle partnerLogo={partnerLogo} />
              </td>
              <td className='px-4 py-2.5'>
                <div className='flex items-center justify-end gap-1'>
                  <Link
                    href={APP_ROUTES.content.partnerLogos.edit(partnerLogo.id)}
                    aria-label={`Edit ${partnerLogo.companyName}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                  >
                    <Pencil className='size-4' />
                  </Link>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 text-destructive hover:text-destructive'
                    disabled={pendingDeleteId === partnerLogo.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${partnerLogo.companyName}"? This cannot be undone.`)) {
                        handleDelete(partnerLogo.id);
                      }
                    }}
                    aria-label={`Delete ${partnerLogo.companyName}`}
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
