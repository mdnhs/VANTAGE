'use client';

import { ImageIcon } from 'lucide-react';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/admin/dashboard/empty-state';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { CardSkeleton } from '@/components/admin/dashboard/skeletons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useActor, useCan } from '@/contexts/actor-provider';

import { useMediaList } from '../hooks/use-media';
import type { MediaItem, MediaTypeFilter } from '../types';
import { MediaDetailsSheet } from './media-details-sheet';
import { MediaGrid } from './media-grid';
import { UploadDropzone } from './upload-dropzone';

const TYPES: ReadonlyArray<readonly [MediaTypeFilter | null, string]> = [
  [null, 'All'],
  ['image', 'Images'],
  ['video', 'Videos'],
  ['pdf', 'PDFs'],
];

// The library filters live in the URL, so a link such as the SEO overview's
// "Find images without alt text" opens the library already filtered.
const filterParams = {
  q: parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
  missingAlt: parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true }),
};

export function MediaView() {
  const actor = useActor();
  const canUpload = useCan({ media: ['upload'] }) && !actor.impersonatedBy;
  const [filters, setFilters] = useQueryStates(filterParams, { history: 'replace' });
  const { q, missingAlt } = filters;
  const [search, setSearch] = useState(q);
  const [type, setType] = useState<MediaTypeFilter | null>(null);
  // Keep the opened item itself: a filter change or a save must not close its sheet.
  const [openItem, setOpenItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => void setFilters({ q: search.trim() }), 250);
    return () => clearTimeout(timer);
  }, [search, setFilters]);

  const list = useMediaList({ q: q || undefined, type: type ?? undefined, missingAlt: missingAlt || undefined });
  const opened: MediaItem | null = openItem ? (list.items.find((item) => item.id === openItem.id) ?? openItem) : null;

  return (
    <div className='flex flex-col gap-6'>
      <PageHeader title='Media' description='Images, videos and PDFs used across the site.' />
      {canUpload ? <UploadDropzone /> : null}

      <div className='flex flex-wrap items-center gap-3'>
        <Input
          type='search'
          aria-label='Search the library'
          placeholder='Search by file name or alt text'
          className='max-w-xs'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className='flex gap-1'>
          {TYPES.map(([value, label]) => (
            <Button
              key={label}
              type='button'
              size='sm'
              variant={type === value ? 'secondary' : 'outline'}
              aria-pressed={type === value}
              onClick={() => setType(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className='flex items-center gap-2'>
          <Switch id='media-missing-alt' checked={missingAlt} onCheckedChange={(checked) => void setFilters({ missingAlt: checked })} />
          <Label htmlFor='media-missing-alt'>Missing alt text</Label>
        </div>
      </div>

      {list.isPending ? (
        <CardSkeleton />
      ) : list.isError ? (
        <EmptyState
          title="The library didn't load"
          description={list.error.message}
          action={<Button onClick={() => list.refetch()}>Try again</Button>}
        />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title='No files found'
          description='Uploaded images, videos and PDFs appear here.'
        />
      ) : (
        <MediaGrid items={list.items} onOpen={setOpenItem} />
      )}
      {list.hasNextPage ? (
        <div>
          <Button
            type='button'
            variant='outline'
            disabled={list.isFetchingNextPage}
            onClick={() => list.fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      ) : null}
      <MediaDetailsSheet item={opened} onClose={() => setOpenItem(null)} />
    </div>
  );
}
