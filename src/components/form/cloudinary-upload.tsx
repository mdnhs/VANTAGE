'use client';

import { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cldUrl } from '@/lib/cloudinary/url';
import { API_ROUTES } from '@/lib/routes/api-routes';

type UploadMode = 'single-image' | 'before-after' | 'gallery' | 'video';

interface SignResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

async function getSignature(folder: string): Promise<SignResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}${API_ROUTES.media.sign}`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    },
  );
  if (!res.ok) throw new Error('Failed to sign upload');
  const body = await res.json();
  return body.data as SignResponse;
}

async function uploadToCloudinary(file: File, sig: SignResponse): Promise<{ public_id: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const resourceType = sig.folder.includes('video') ? 'video' : 'image';
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Upload to Cloudinary failed');
  return res.json();
}

interface CloudinaryUploadProps {
  mode: UploadMode;
  folder: string;
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  // Only meaningful for mode='gallery' — caps how many images the picker will accept.
  // 'before-after' is implicitly capped at 2 (before + after slots).
  maxFiles?: number;
}

// Single component covering every upload shape used across the CMS. Signs via /media/sign
// and uploads directly to Cloudinary — no file bytes ever pass through our own server, and
// only the returned `public_id` is stored.
export function CloudinaryUpload({ mode, folder, value, onChange, maxFiles }: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isGallery = mode === 'gallery';
  const isBeforeAfter = mode === 'before-after';
  const isMultiValue = isGallery || isBeforeAfter;
  const currentIds = isMultiValue ? (Array.isArray(value) ? value : []) : value ? [value as string] : [];
  const limit = isBeforeAfter ? 2 : maxFiles;
  const remainingSlots = limit != null ? Math.max(0, limit - currentIds.length) : undefined;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = remainingSlots != null ? Array.from(files).slice(0, remainingSlots) : Array.from(files);
    if (selected.length === 0) {
      setError(`Maximum of ${limit} image${limit === 1 ? '' : 's'} reached.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const uploads = await Promise.all(
        selected.map(async (file) => {
          const sig = await getSignature(folder);
          const result = await uploadToCloudinary(file, sig);
          return result.public_id;
        }),
      );

      if (isMultiValue) {
        onChange([...currentIds, ...uploads]);
      } else {
        onChange(uploads[0] ?? null);
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (publicId: string) => {
    if (isMultiValue) {
      onChange(currentIds.filter((id) => id !== publicId));
    } else {
      onChange(null);
    }
  };

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap gap-3'>
        {currentIds.map((publicId, index) => (
          <div key={publicId} className='flex flex-col items-center gap-1'>
            <div className='relative h-24 w-24 overflow-hidden rounded-lg border border-border'>
              {mode === 'video' ? (
                <div className='flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground'>
                  video
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cldUrl(publicId, { width: 200, height: 200, crop: 'fill' })}
                  alt=''
                  className='h-full w-full object-cover'
                />
              )}
              <button
                type='button'
                onClick={() => removeAt(publicId)}
                className='absolute top-1 right-1 rounded-full bg-background/80 p-0.5 text-foreground'
                aria-label='Remove'
              >
                <X className='size-3.5' />
              </button>
            </div>
            {isBeforeAfter && <span className='text-xs text-muted-foreground'>{index === 0 ? 'Before' : 'After'}</span>}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type='file'
        accept={mode === 'video' ? 'video/*' : 'image/*'}
        multiple={isMultiValue}
        className='hidden'
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={isUploading || remainingSlots === 0}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className='size-4' data-icon='inline-start' />
        {isUploading
          ? 'Uploading…'
          : remainingSlots === 0
            ? 'Limit reached'
            : isBeforeAfter && currentIds.length === 0
              ? 'Upload before + after'
              : 'Upload'}
      </Button>
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  );
}
