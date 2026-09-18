'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { HOMEPAGE_CATALOG_ICONS, type HomepageCatalogIcon } from '@/validations/homepage-catalog-schema';
import type { CreateHomepageCatalogInput, HomepageCatalog } from '../types';

interface FormState {
  title: string;
  description: string;
  badge: string;
  footnote: string;
  icon: HomepageCatalogIcon;
  iconPublicId: string;
  isEnabled: boolean;
}

function toFormState(data: HomepageCatalog | null): FormState {
  return {
    title: data?.title ?? '',
    description: data?.description ?? '',
    badge: data?.badge ?? '',
    footnote: data?.footnote ?? 'Free Estimate',
    icon: (data?.icon as HomepageCatalogIcon) ?? 'car-front',
    iconPublicId: data?.iconPublicId ?? '',
    isEnabled: data?.isEnabled ?? true,
  };
}

function iconLabel(icon: string): string {
  return icon
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface HomepageCatalogFormProps {
  initialData?: HomepageCatalog | null;
  onSubmit: (input: CreateHomepageCatalogInput) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

export function HomepageCatalogForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: HomepageCatalogFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title: form.title,
      description: form.description,
      badge: form.badge.trim() ? form.badge.trim() : null,
      footnote: form.footnote.trim() ? form.footnote.trim() : 'Free Estimate',
      icon: form.icon,
      iconPublicId: form.iconPublicId || null,
      isEnabled: form.isEnabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Catalog item details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder='e.g. Crash & Collision Repair'
              required
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='badge'>Badge (optional)</Label>
            <Input
              id='badge'
              value={form.badge}
              onChange={(e) => setField('badge', e.target.value)}
              placeholder='e.g. OEM Certified or Same Day PDR'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='footnote'>Footnote</Label>
            <Input
              id='footnote'
              value={form.footnote}
              onChange={(e) => setField('footnote', e.target.value)}
              placeholder='e.g. Insurance Approved or Free Estimate'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='icon'>Preset Icon</Label>
            <Select value={form.icon} onValueChange={(value) => setField('icon', value as HomepageCatalogIcon)}>
              <SelectTrigger id='icon'>
                <SelectValue placeholder='Select an icon' />
              </SelectTrigger>
              <SelectContent>
                {HOMEPAGE_CATALOG_ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {iconLabel(icon)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center gap-3 pt-6'>
            <Switch
              id='isEnabled'
              checked={form.isEnabled}
              onCheckedChange={(checked) => setField('isEnabled', checked)}
            />
            <Label htmlFor='isEnabled'>Visible on homepage catalog</Label>
          </div>

          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              placeholder='Describe this service in 1-2 punchy sentences...'
              required
            />
          </div>

          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label>Custom Icon Image (optional override)</Label>
            <p className='text-xs text-muted-foreground'>
              Upload a custom SVG/PNG icon, or leave empty to use the preset icon chosen above.
            </p>
            <CloudinaryUpload
              mode='single-image'
              folder='vantage/catalogs'
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
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.homepageCatalogs.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
