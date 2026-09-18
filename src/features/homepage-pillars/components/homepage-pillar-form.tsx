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
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { HOMEPAGE_PILLAR_ICONS, type HomepagePillarIcon } from '@/validations/homepage-pillar-schema';
import type { HomepagePillar } from '../types';

interface FormState {
  title: string;
  description: string;
  icon: HomepagePillarIcon;
  isEnabled: boolean;
}

function toFormState(data: HomepagePillar | null): FormState {
  return {
    title: data?.title ?? '',
    description: data?.description ?? '',
    icon: (data?.icon as HomepagePillarIcon) ?? 'factory',
    isEnabled: data?.isEnabled ?? true,
  };
}

function iconLabel(icon: string): string {
  return icon.charAt(0).toUpperCase() + icon.slice(1);
}

interface HomepagePillarFormProps {
  initialData?: HomepagePillar | null;
  onSubmit: (input: {
    title: string;
    description: string;
    icon: HomepagePillarIcon;
    isEnabled: boolean;
  }) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

// Shared by both the create and edit screens — only the submit handler and initial data
// differ between them.
export function HomepagePillarForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: HomepagePillarFormProps) {
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
      icon: form.icon,
      isEnabled: form.isEnabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Homepage pillar details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='title'>Title</Label>
            <Input id='title' value={form.title} onChange={(e) => setField('title', e.target.value)} required />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='icon'>Icon</Label>
            <Select value={form.icon} onValueChange={(value) => setField('icon', value as HomepagePillarIcon)}>
              <SelectTrigger id='icon'>
                <SelectValue placeholder='Select an icon' />
              </SelectTrigger>
              <SelectContent>
                {HOMEPAGE_PILLAR_ICONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {iconLabel(icon)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className='flex items-center gap-3 pt-2'>
            <Switch
              id='isEnabled'
              checked={form.isEnabled}
              onCheckedChange={(checked) => setField('isEnabled', checked)}
            />
            <Label htmlFor='isEnabled'>Visible on the public site</Label>
          </div>
        </CardContent>
      </Card>

      {submitError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.homepagePillars.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
