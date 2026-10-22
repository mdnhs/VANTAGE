'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useActor } from '@/contexts/actor-provider';
import { hasPermission } from '@/lib/auth/permissions';

import { mediaKeys, useDeleteMedia, useMediaUsage, useUpdateMedia } from '../hooks/use-media';
import { MEDIA_URL, MediaApiError } from '../services/api';
import type { MediaItem, MediaUse } from '../types';
import { uploadMedia } from '../upload';
import { FocalPicker } from './focal-picker';

// Authors edit only the files they uploaded. The server enforces it; this only
// hides controls that would be refused. While viewing as someone, nothing is
// editable.
export function useMediaRights(item: Pick<MediaItem, 'createdBy'> | null) {
  const actor = useActor();
  const editAll = hasPermission(
    actor.roles.filter((role) => role !== 'author'),
    { media: ['update'] },
  );
  const own = item?.createdBy === actor.user.id;
  const live = !actor.impersonatedBy;
  return {
    canEdit: live && hasPermission(actor.roles, { media: ['update'] }) && (editAll || own),
    canDelete: live && hasPermission(actor.roles, { media: ['delete'] }) && (editAll || own),
  };
}

export function MediaDetailsSheet({ item, onClose }: { item: MediaItem | null; onClose(): void }) {
  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle className='text-lg font-semibold break-all'>{item?.filename ?? 'File'}</SheetTitle>
          <SheetDescription className='sr-only'>Details, usage and actions for this file</SheetDescription>
        </SheetHeader>
        {item ? <DetailsBody key={`${item.id}:${item.url}`} item={item} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function UsageList({ usage }: { usage: MediaUse[] }) {
  return (
    <ul className='list-disc pl-5 text-sm'>
      {usage.map((use) => (
        <li key={`${use.kind}:${use.id}`}>
          {use.href ? (
            <Link href={use.href} className='underline underline-offset-4'>
              {use.label}
            </Link>
          ) : (
            use.label
          )}{' '}
          ({use.kind})
        </li>
      ))}
    </ul>
  );
}

function DetailsBody({ item, onClose }: { item: MediaItem; onClose(): void }) {
  const queryClient = useQueryClient();
  const { canEdit, canDelete } = useMediaRights(item);
  const isImage = item.mimeType.startsWith('image/');
  const [alt, setAlt] = useState(item.alt);
  const [caption, setCaption] = useState(item.caption ?? '');
  const [decorative, setDecorative] = useState(item.isDecorative);
  const [focal, setFocal] = useState({ x: item.focalX, y: item.focalY });
  const [error, setError] = useState<string | null>(null);
  const [blocking, setBlocking] = useState<MediaUse[]>([]);
  const [replacing, setReplacing] = useState<number | null>(null);
  const usage = useMediaUsage(item.id);
  const update = useUpdateMedia(item.id);
  const remove = useDeleteMedia();
  const message = (e: unknown, fallback: string) => (e instanceof MediaApiError ? e.message : fallback);

  async function save() {
    setError(null);
    try {
      await update.mutateAsync({
        alt,
        caption: caption || null,
        isDecorative: decorative,
        focalX: focal.x,
        focalY: focal.y,
      });
      toast.success('Details saved');
    } catch (e) {
      setError(message(e, "Couldn't save the details"));
    }
  }

  async function replace(file: File) {
    setError(null);
    setReplacing(0);
    try {
      await uploadMedia(file, setReplacing, {
        url: `${MEDIA_URL}/${item.id}/replace`,
        kind: isImage ? 'image' : item.mimeType.startsWith('video/') ? 'video' : 'any',
      });
      toast.success('File replaced');
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      onClose();
    } catch (e) {
      setError(message(e, "Couldn't replace the file"));
    } finally {
      setReplacing(null);
    }
  }

  async function destroy() {
    if (!window.confirm(`Delete ${item.filename}? This can't be undone.`)) return;
    setError(null);
    setBlocking([]);
    try {
      await remove.mutateAsync(item.id);
      toast.success('File deleted');
      onClose();
    } catch (e) {
      setError(message(e, "Couldn't delete the file"));
      if (e instanceof MediaApiError && e.status === 409) setBlocking(e.usage);
    }
  }

  return (
    <div className='flex flex-col gap-5 p-4'>
      {isImage ? <FocalPicker item={item} value={focal} onChange={setFocal} disabled={!canEdit} /> : null}
      {item.mimeType.startsWith('video/') ? (
        <video src={item.url} controls preload='metadata' className='max-h-72 w-full rounded-xl bg-muted' />
      ) : null}
      <a href={item.url} target='_blank' rel='noreferrer' className='text-sm font-medium underline underline-offset-4'>
        Open file
      </a>

      <fieldset disabled={!canEdit} className='flex min-w-0 flex-col gap-4'>
        {isImage ? (
          <>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='media-alt'>Alt text</Label>
              <Textarea
                id='media-alt'
                value={alt}
                maxLength={300}
                disabled={decorative || !canEdit}
                onChange={(e) => setAlt(e.target.value)}
              />
              <p className='text-xs text-muted-foreground'>{alt.length}/300</p>
            </div>
            <div className='flex items-center gap-3'>
              <Switch id='media-decorative' checked={decorative} disabled={!canEdit} onCheckedChange={setDecorative} />
              <Label htmlFor='media-decorative'>Decorative (screen readers skip it)</Label>
            </div>
          </>
        ) : null}
        <div className='flex flex-col gap-2'>
          <Label htmlFor='media-caption'>Caption</Label>
          <Input id='media-caption' value={caption} maxLength={500} onChange={(e) => setCaption(e.target.value)} />
        </div>
        {canEdit ? (
          <div>
            <Button type='button' onClick={save} disabled={update.isPending}>
              Save details
            </Button>
          </div>
        ) : null}
      </fieldset>

      <section aria-labelledby='media-usage' className='flex flex-col gap-2'>
        <h3 id='media-usage' className='text-sm font-semibold'>
          Used on
        </h3>
        {usage.isPending ? (
          <p className='text-sm text-muted-foreground'>Checking…</p>
        ) : usage.isError ? (
          <p className='text-sm text-muted-foreground'>{usage.error.message}</p>
        ) : usage.data.length ? (
          <UsageList usage={usage.data} />
        ) : (
          <p className='text-sm text-muted-foreground'>Not used anywhere</p>
        )}
      </section>

      {canEdit ? (
        <div className='flex flex-col gap-2'>
          <Label htmlFor='media-replace'>Replace file (keeps every reference)</Label>
          {replacing !== null ? (
            <p role='status' className='text-sm'>
              Replacing: {replacing}%
            </p>
          ) : null}
          <Input
            id='media-replace'
            type='file'
            disabled={replacing !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void replace(file);
              e.target.value = '';
            }}
          />
        </div>
      ) : null}

      {error ? (
        <div role='alert' className='flex flex-col gap-2 text-sm text-destructive'>
          <p>{error}</p>
          {blocking.length ? <UsageList usage={blocking} /> : null}
        </div>
      ) : null}

      {canDelete ? (
        <div>
          <Button type='button' variant='destructive' onClick={destroy}>
            Delete file
          </Button>
        </div>
      ) : null}
    </div>
  );
}
