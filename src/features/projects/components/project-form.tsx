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
import type { ProjectWithGallery } from '../types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Reuses the category labels already shown on the public portfolio filters
// (src/components/marketing/portfolio-filters.tsx) as suggestions — `serviceCategory` stays
// free text (not FK'd to the services table), so any value can still be typed.
const CATEGORY_SUGGESTIONS = ['Crash Repair', 'Bodywork', 'Paint', 'Respray', 'Restoration', 'Custom'];

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

interface FormState {
  title: string;
  slug: string;
  vehicleModel: string;
  serviceCategory: string;
  description: string;
  completedAt: string;
  isFeatured: boolean;
  beforeImagePublicId: string;
  afterImagePublicId: string;
  galleryImagePublicIds: string[];
}

function toFormState(data: ProjectWithGallery | null): FormState {
  return {
    title: data?.title ?? '',
    slug: data?.slug ?? '',
    vehicleModel: data?.vehicleModel ?? '',
    serviceCategory: data?.serviceCategory ?? '',
    description: data?.description ?? '',
    completedAt: toDateInputValue(data?.completedAt),
    isFeatured: data?.isFeatured ?? false,
    beforeImagePublicId: data?.beforeImagePublicId ?? '',
    afterImagePublicId: data?.afterImagePublicId ?? '',
    galleryImagePublicIds: data?.galleryImages?.map((g) => g.imagePublicId) ?? [],
  };
}

export interface ProjectFormSubmitInput {
  title: string;
  slug: string;
  vehicleModel: string;
  serviceCategory: string;
  description: string;
  completedAt: string | null;
  isFeatured: boolean;
  beforeImagePublicId: string;
  afterImagePublicId: string;
  galleryImagePublicIds: string[];
}

interface ProjectFormProps {
  initialData?: ProjectWithGallery | null;
  onSubmit: (input: ProjectFormSubmitInput) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

// Shared by both the create and edit screens — only the submit handler and initial data
// differ between them.
export function ProjectForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: ProjectFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    setField('title', value);
    if (!slugTouched) {
      setField('slug', slugify(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title: form.title,
      slug: form.slug,
      vehicleModel: form.vehicleModel,
      serviceCategory: form.serviceCategory,
      description: form.description,
      completedAt: form.completedAt || null,
      isFeatured: form.isFeatured,
      beforeImagePublicId: form.beforeImagePublicId,
      afterImagePublicId: form.afterImagePublicId,
      galleryImagePublicIds: form.galleryImagePublicIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='title'>Title</Label>
            <Input id='title' value={form.title} onChange={(e) => handleTitleChange(e.target.value)} required />
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
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='vehicleModel'>Vehicle model</Label>
            <Input
              id='vehicleModel'
              value={form.vehicleModel}
              onChange={(e) => setField('vehicleModel', e.target.value)}
              placeholder='e.g. BMW 3 Series'
              required
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='serviceCategory'>Category</Label>
            <Input
              id='serviceCategory'
              list='project-category-suggestions'
              value={form.serviceCategory}
              onChange={(e) => setField('serviceCategory', e.target.value)}
              placeholder='e.g. Crash Repair'
              required
            />
            <datalist id='project-category-suggestions'>
              {CATEGORY_SUGGESTIONS.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
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
            <Label htmlFor='completedAt'>Completed on</Label>
            <Input
              id='completedAt'
              type='date'
              value={form.completedAt}
              onChange={(e) => setField('completedAt', e.target.value)}
            />
          </div>
          <div className='flex items-center gap-3 pt-6'>
            <Switch
              id='isFeatured'
              checked={form.isFeatured}
              onCheckedChange={(checked) => setField('isFeatured', checked)}
            />
            <Label htmlFor='isFeatured'>Feature on homepage</Label>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label>Before / after images</Label>
            <CloudinaryUpload
              mode='before-after'
              folder='vantage/projects'
              value={[form.beforeImagePublicId, form.afterImagePublicId].filter(Boolean)}
              onChange={(value) => {
                const ids = Array.isArray(value) ? value : value ? [value] : [];
                setField('beforeImagePublicId', ids[0] ?? '');
                setField('afterImagePublicId', ids[1] ?? '');
              }}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Gallery (up to 10 images)</Label>
            <CloudinaryUpload
              mode='gallery'
              folder='vantage/projects'
              maxFiles={10}
              value={form.galleryImagePublicIds}
              onChange={(value) => setField('galleryImagePublicIds', Array.isArray(value) ? value : [])}
            />
          </div>
        </CardContent>
      </Card>

      {submitError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.projects.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
