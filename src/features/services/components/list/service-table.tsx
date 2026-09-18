'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useServiceList } from '../../hooks/api/query/use-service-list';
import { useUpdateService } from '../../hooks/api/mutation/use-update-service';
import { useDeleteService } from '../../hooks/api/mutation/use-delete-service';
import { useReorderServices } from '../../hooks/api/mutation/use-reorder-services';
import type { Service } from '../../types';

interface ServiceTableProps {
  initialData: { data: Service[]; total: number };
}

const FILTERS = { page: 1, limit: 50 };

// Inline row toggle needs its own mutation instance scoped to that row's id.
function EnabledToggle({ service }: { service: Service }) {
  const updateService = useUpdateService(service.id);
  return (
    <Switch
      checked={service.isEnabled}
      disabled={updateService.isPending}
      onCheckedChange={(checked) => updateService.mutate({ isEnabled: checked })}
      aria-label={`${service.isEnabled ? 'Disable' : 'Enable'} ${service.name}`}
    />
  );
}

export function ServiceTable({ initialData }: ServiceTableProps) {
  const { data } = useServiceList(FILTERS);
  const rows = data?.data ?? initialData.data;
  const deleteService = useDeleteService();
  const reorderServices = useReorderServices();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderServices.mutate({ ids });
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    deleteService.mutate(id, { onSettled: () => setPendingDeleteId(null) });
  };

  if (rows.length === 0) {
    return <p className='text-sm text-muted-foreground'>No services yet. Create the first one to get started.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Order</th>
            <th className='px-4 py-2.5 font-medium'>Name</th>
            <th className='px-4 py-2.5 font-medium'>Slug</th>
            <th className='px-4 py-2.5 font-medium'>Starting price</th>
            <th className='px-4 py-2.5 font-medium'>Enabled</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((service, index) => (
            <tr key={service.id} className='border-b border-border last:border-0'>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === 0 || reorderServices.isPending}
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
                    disabled={index === rows.length - 1 || reorderServices.isPending}
                    onClick={() => move(index, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </div>
              </td>
              <td className='px-4 py-2.5 font-medium'>{service.name}</td>
              <td className='px-4 py-2.5 text-muted-foreground'>{service.slug}</td>
              <td className='px-4 py-2.5'>{service.startingPrice != null ? `€${service.startingPrice}` : '—'}</td>
              <td className='px-4 py-2.5'>
                <EnabledToggle service={service} />
              </td>
              <td className='px-4 py-2.5'>
                <div className='flex items-center justify-end gap-1'>
                  <Link
                    href={APP_ROUTES.content.services.edit(service.id)}
                    aria-label={`Edit ${service.name}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                  >
                    <Pencil className='size-4' />
                  </Link>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 text-destructive hover:text-destructive'
                    disabled={pendingDeleteId === service.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${service.name}"? This cannot be undone.`)) {
                        handleDelete(service.id);
                      }
                    }}
                    aria-label={`Delete ${service.name}`}
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
