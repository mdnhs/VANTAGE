'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { mediaKeys } from '../hooks/use-media';
import { MediaApiError } from '../services/api';
import type { MediaItem, MediaKind } from '../types';
import { ACCEPT, uploadMedia } from '../upload';

type Progress = { id: number; name: string; pct: number };
type Failure = { id: number; file: File; message: string };
let nextId = 0;

const HINT: Record<MediaKind | 'any', string> = {
  image: 'JPEG, PNG, WebP or AVIF, up to 20 MB each',
  video: 'MP4 or WebM, up to 100 MB each',
  any: 'JPEG, PNG, WebP, AVIF, PDF up to 20 MB; MP4 or WebM up to 100 MB',
};

// Drop or choose files; they upload one at a time (the server processes images
// with a small concurrency cap) with per-file progress and a retry for busy or
// dropped connections.
export function UploadDropzone({
  kind = 'any',
  multiple = true,
  compact = false,
  disabled = false,
  onUploaded,
}: {
  kind?: MediaKind | 'any';
  multiple?: boolean;
  compact?: boolean;
  disabled?: boolean;
  onUploaded?: (item: MediaItem) => void;
}) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<Progress[]>([]);
  const [failed, setFailed] = useState<Failure[]>([]);

  async function upload(files: File[]) {
    for (const file of files) {
      const id = nextId++;
      const patch = (pct: number) =>
        setUploads((all) =>
          all.some((u) => u.id === id)
            ? all.map((u) => (u.id === id ? { ...u, pct } : u))
            : [...all, { id, name: file.name, pct }],
        );
      patch(0);
      try {
        const item = await uploadMedia(file, patch, { kind });
        onUploaded?.(item);
      } catch (error) {
        const message = error instanceof MediaApiError ? error.message : 'Upload failed';
        toast.error(`${file.name}: ${message}`);
        // A busy server or a dropped connection is worth another go; the rest need a different file.
        if (
          error instanceof MediaApiError &&
          (error.code === 'SERVICE_UNAVAILABLE' || error.code === 'NETWORK' || error.code === 'RATE_LIMITED')
        ) {
          setFailed((all) => [...all, { id, file, message }]);
        }
      } finally {
        setUploads((all) => all.filter((u) => u.id !== id));
      }
    }
    await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
  }

  return (
    <div className='flex flex-col gap-2'>
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed text-center text-sm focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted/50',
          compact ? 'p-3' : 'p-6',
          disabled && 'pointer-events-none opacity-50',
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (disabled) return;
          const files = [...e.dataTransfer.files];
          void upload(multiple ? files : files.slice(0, 1));
        }}
      >
        <span className='font-medium'>
          {multiple ? 'Drop files here or choose them' : 'Drop a file here or choose it'}
        </span>
        <span className='text-muted-foreground'>{HINT[kind]}</span>
        <input
          type='file'
          multiple={multiple}
          disabled={disabled}
          aria-label='Upload files'
          accept={ACCEPT[kind]}
          className='sr-only'
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = '';
            if (files.length) void upload(multiple ? files : files.slice(0, 1));
          }}
        />
      </label>
      <div role='status' className='flex flex-col gap-1 text-sm'>
        {uploads.map((u) => (
          <p key={u.id}>
            Uploading {u.name}: {u.pct}%
          </p>
        ))}
      </div>
      {failed.length ? (
        <div role='alert' className='flex flex-col gap-2 text-sm'>
          {failed.map(({ id, file, message }) => (
            <div key={id} className='flex flex-wrap items-center gap-2'>
              <span className='text-destructive'>
                {file.name}: {message}
              </span>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => {
                  setFailed((all) => all.filter((f) => f.id !== id));
                  void upload([file]);
                }}
              >
                Retry
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
