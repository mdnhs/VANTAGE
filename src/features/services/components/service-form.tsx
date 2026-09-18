'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { Service } from '../types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  iconPublicId: string;
  startingPrice: string;
  isEnabled: boolean;
}

function toFormState(data: Service | null): FormState {
  return {
    name: data?.name ?? '',
    slug: data?.slug ?? '',
    description: data?.description ?? '',
    iconPublicId: data?.iconPublicId ?? '',
    startingPrice: data?.startingPrice != null ? String(data.startingPrice) : '',
    isEnabled: data?.isEnabled ?? true,
  };
}

interface ServiceFormProps {
  initialData?: Service | null;
  onSubmit: (input: {
    name: string;
    slug: string;
    description: string;
    iconPublicId: string | null;
    startingPrice: number | null;
    isEnabled: boolean;
  }) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

// Shared by both the create and edit screens — only the submit handler and initial data
// differ between them.
export function ServiceForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: ServiceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setField('name', value);
    if (!slugTouched) {
      setField('slug', slugify(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: form.name,
      slug: form.slug,
      description: form.description,
      iconPublicId: form.iconPublicId || null,
      startingPrice: form.startingPrice.trim() === '' ? null : Number(form.startingPrice),
      isEnabled: form.isEnabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Service details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='name'>Name</Label>
            <Input id='name' value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='slug'>Slug</Label>
            <Input
              id='slug'
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setField('slug', e.target.value);
              }}
              pattern='^[a-z0-9]+(-[a-z0-9]+)*$'
              required
            />
          </div>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              required
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='startingPrice'>Starting price (€)</Label>
            <Input
              id='startingPrice'
              type='number'
              min={0}
              value={form.startingPrice}
              onChange={(e) => setField('startingPrice', e.target.value)}
              placeholder='Optional'
            />
          </div>
          <div className='flex items-center gap-3 pt-6'>
            <Switch
              id='isEnabled'
              checked={form.isEnabled}
              onCheckedChange={(checked) => setField('isEnabled', checked)}
            />
            <Label htmlFor='isEnabled'>Visible on the public site</Label>
          </div>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label>Icon</Label>
            <CloudinaryUpload
              mode='single-image'
              folder='vantage/services'
              value={form.iconPublicId || null}
              onChange={(v) => setField('iconPublicId', (v as string) ?? '')}
            />
          </div>
        </CardContent>
      </Card>

      {submitError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.services.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
