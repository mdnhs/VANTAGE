'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Pencil, Star, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useTestimonialList } from '../../hooks/api/query/use-testimonial-list';
import { useUpdateTestimonial } from '../../hooks/api/mutation/use-update-testimonial';
import { useDeleteTestimonial } from '../../hooks/api/mutation/use-delete-testimonial';
import { useReorderTestimonials } from '../../hooks/api/mutation/use-reorder-testimonials';
import { useToggleTestimonialStatus } from '../../hooks/api/mutation/use-toggle-testimonial-status';
import type { Testimonial } from '../../types';

interface TestimonialTableProps {
  initialData: { data: Testimonial[]; total: number };
}

const FILTERS = { page: 1, limit: 50 };

// Read-only star display — filled stars up to `rating`, out of 5.
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className='flex items-center gap-0.5' aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('size-3.5', n <= rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/40')}
        />
      ))}
    </div>
  );
}

// Inline row toggle needs its own mutation instance scoped to that row's id.
function StatusToggle({ testimonial }: { testimonial: Testimonial }) {
  const toggleStatus = useToggleTestimonialStatus(testimonial.id);
  const isPublished = testimonial.status === 'published';
  return (
    <div className='flex items-center gap-2'>
      <Switch
        checked={isPublished}
        disabled={toggleStatus.isPending}
        onCheckedChange={(checked) => toggleStatus.mutate(checked ? 'published' : 'hidden')}
        aria-label={`${isPublished ? 'Hide' : 'Publish'} ${testimonial.customerName}`}
      />
      <span className={cn('text-xs font-medium uppercase', isPublished ? 'text-emerald-600' : 'text-muted-foreground')}>
        {testimonial.status}
      </span>
    </div>
  );
}

function FeaturedToggle({ testimonial }: { testimonial: Testimonial }) {
  const updateTestimonial = useUpdateTestimonial(testimonial.id);
  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className={cn('size-8', testimonial.isFeatured ? 'text-amber-500' : 'text-muted-foreground')}
      disabled={updateTestimonial.isPending}
      onClick={() => updateTestimonial.mutate({ isFeatured: !testimonial.isFeatured })}
      aria-label={testimonial.isFeatured ? 'Unfeature' : 'Feature on homepage'}
    >
      <Star className={cn('size-4', testimonial.isFeatured && 'fill-current')} />
    </Button>
  );
}

export function TestimonialTable({ initialData }: TestimonialTableProps) {
  const { data } = useTestimonialList(FILTERS);
  const rows = data?.data ?? initialData.data;
  const deleteTestimonial = useDeleteTestimonial();
  const reorderTestimonials = useReorderTestimonials();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ids = rows.map((row) => row.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderTestimonials.mutate({ ids });
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    deleteTestimonial.mutate(id, { onSettled: () => setPendingDeleteId(null) });
  };

  if (rows.length === 0) {
    return <p className='text-sm text-muted-foreground'>No testimonials yet. Create the first one to get started.</p>;
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-border'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border bg-muted/50 text-left text-muted-foreground'>
            <th className='px-4 py-2.5 font-medium'>Order</th>
            <th className='px-4 py-2.5 font-medium'>Customer</th>
            <th className='px-4 py-2.5 font-medium'>Rating</th>
            <th className='px-4 py-2.5 font-medium'>Review</th>
            <th className='px-4 py-2.5 font-medium'>Status</th>
            <th className='px-4 py-2.5 font-medium'>Featured</th>
            <th className='px-4 py-2.5 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((testimonial, index) => (
            <tr key={testimonial.id} className='border-b border-border last:border-0'>
              <td className='px-4 py-2.5'>
                <div className='flex items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === 0 || reorderTestimonials.isPending}
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
                    disabled={index === rows.length - 1 || reorderTestimonials.isPending}
                    onClick={() => move(index, 1)}
                    aria-label='Move down'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                </div>
              </td>
              <td className='px-4 py-2.5 font-medium'>{testimonial.customerName}</td>
              <td className='px-4 py-2.5'>
                <RatingStars rating={testimonial.rating} />
              </td>
              <td className='max-w-xs truncate px-4 py-2.5 text-muted-foreground'>{testimonial.reviewText}</td>
              <td className='px-4 py-2.5'>
                <StatusToggle testimonial={testimonial} />
              </td>
              <td className='px-4 py-2.5'>
                <FeaturedToggle testimonial={testimonial} />
              </td>
              <td className='px-4 py-2.5'>
                <div className='flex items-center justify-end gap-1'>
                  <Link
                    href={APP_ROUTES.content.testimonials.edit(testimonial.id)}
                    aria-label={`Edit ${testimonial.customerName}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                  >
                    <Pencil className='size-4' />
                  </Link>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8 text-destructive hover:text-destructive'
                    disabled={pendingDeleteId === testimonial.id}
                    onClick={() => {
                      if (window.confirm(`Delete "${testimonial.customerName}"? This cannot be undone.`)) {
                        handleDelete(testimonial.id);
                      }
                    }}
                    aria-label={`Delete ${testimonial.customerName}`}
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
