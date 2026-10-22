'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useActor, useCan } from '@/contexts/actor-provider';

import { useMediaList } from '../hooks/use-media';
import type { MediaItem, MediaKind } from '../types';
import { MediaThumb } from './media-grid';
import { UploadDropzone } from './upload-dropzone';

// Pick a library item (images or videos only), or upload one in place. With
// `multiple` the dialog stays open and reports every pick until "Done".
export function MediaPickerDialog({
  open,
  onOpenChange,
  onPick,
  selectedId,
  selectedIds,
  kind,
  multiple = false,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  onPick(item: MediaItem): void;
  selectedId?: string | null;
  selectedIds?: string[];
  kind: MediaKind;
  multiple?: boolean;
}) {
  const actor = useActor();
  const canUpload = useCan({ media: ['upload'] }) && !actor.impersonatedBy;
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const library = useMediaList({ q: q || undefined, type: kind }, open);
  const picked = new Set(selectedIds ?? (selectedId ? [selectedId] : []));

  function choose(item: MediaItem) {
    onPick(item);
    if (!multiple) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{kind === 'video' ? 'Choose a video' : 'Choose an image'}</DialogTitle>
        </DialogHeader>
        <div className='flex flex-wrap items-center gap-2'>
          <Input
            aria-label='Search the library'
            placeholder='Search by name or alt text'
            className='max-w-sm flex-1'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {canUpload ? (
            <Button type='button' variant='outline' aria-pressed={uploading} onClick={() => setUploading((v) => !v)}>
              Upload
            </Button>
          ) : null}
        </div>
        {uploading && canUpload ? (
          <UploadDropzone
            kind={kind}
            multiple={false}
            compact
            onUploaded={(item) => {
              setUploading(false);
              choose(item);
            }}
          />
        ) : null}
        {library.isError ? (
          <p role='alert' className='text-sm text-destructive'>
            {library.error.message}
          </p>
        ) : null}
        <ul className='grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4'>
          {library.items.map((item) => (
            <li key={item.id}>
              <button
                type='button'
                className='w-full rounded-xl border p-1 text-left focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary'
                aria-pressed={picked.has(item.id)}
                onClick={() => choose(item)}
              >
                <MediaThumb item={item} className='rounded-lg' />
                <span className='mt-1 block truncate text-xs'>{item.alt || item.filename}</span>
              </button>
            </li>
          ))}
        </ul>
        {!library.isPending && library.items.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No files found.</p>
        ) : null}
        <div className='flex items-center justify-between'>
          {library.hasNextPage ? (
            <Button
              type='button'
              variant='outline'
              disabled={library.isFetchingNextPage}
              onClick={() => library.fetchNextPage()}
            >
              Load more
            </Button>
          ) : (
            <span />
          )}
          {multiple ? (
            <Button type='button' onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
