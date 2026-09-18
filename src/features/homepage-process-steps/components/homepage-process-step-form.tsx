'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { HomepageProcessStep } from '../types';

interface FormState {
  title: string;
  description: string;
  isHighlighted: boolean;
  isEnabled: boolean;
}

function toFormState(data: HomepageProcessStep | null): FormState {
  return {
    title: data?.title ?? '',
    description: data?.description ?? '',
    isHighlighted: data?.isHighlighted ?? false,
    isEnabled: data?.isEnabled ?? true,
  };
}

interface HomepageProcessStepFormProps {
  initialData?: HomepageProcessStep | null;
  onSubmit: (input: {
    title: string;
    description: string;
    isHighlighted: boolean;
    isEnabled: boolean;
  }) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

// Shared by both the create and edit screens — only the submit handler and initial data
// differ between them.
export function HomepageProcessStepForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: HomepageProcessStepFormProps) {
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
      isHighlighted: form.isHighlighted,
      isEnabled: form.isEnabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Process step details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label htmlFor='title'>Title</Label>
            <Input id='title' value={form.title} onChange={(e) => setField('title', e.target.value)} required />
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
              id='isHighlighted'
              checked={form.isHighlighted}
              onCheckedChange={(checked) => setField('isHighlighted', checked)}
            />
            <Label htmlFor='isHighlighted'>Highlight this step (accent color)</Label>
          </div>
          <div className='flex items-center gap-3 pt-2'>
            <Switch
              id='isEnabled'
              checked={form.isEnabled}
              onCheckedChange={(checked) => setField('isEnabled', checked)}
            />
            <Label htmlFor='isEnabled'>Visible on public site</Label>
          </div>
        </CardContent>
      </Card>

      {submitError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={() => router.push(APP_ROUTES.content.homepageProcessSteps.index)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
