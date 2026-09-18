'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { Testimonial } from '../types';

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

// No shadcn star-rating primitive ships in this project — a plain row of 5 icon buttons is
// enough for an admin-only rating input, no new dependency needed.
function RatingInput({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <div className='flex items-center gap-1' role='radiogroup' aria-label='Rating'>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type='button'
          role='radio'
          aria-checked={n === value}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
          className='p-0.5'
        >
          <Star
            className={cn(
              'size-6 transition-colors',
              n <= value ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

interface FormState {
  customerName: string;
  rating: number;
  reviewText: string;
  avatarPublicId: string;
  serviceReceived: string;
  receivedAt: string;
  isFeatured: boolean;
}

function toFormState(data: Testimonial | null): FormState {
  return {
    customerName: data?.customerName ?? '',
    rating: data?.rating ?? 5,
    reviewText: data?.reviewText ?? '',
    avatarPublicId: data?.avatarPublicId ?? '',
    serviceReceived: data?.serviceReceived ?? '',
    receivedAt: toDateInputValue(data?.receivedAt),
    isFeatured: data?.isFeatured ?? false,
  };
}

export interface TestimonialFormSubmitInput {
  customerName: string;
  rating: number;
  reviewText: string;
  avatarPublicId: string | null;
  serviceReceived: string | null;
  receivedAt: string | null;
  isFeatured: boolean;
}

interface TestimonialFormProps {
  initialData?: Testimonial | null;
  onSubmit: (input: TestimonialFormSubmitInput) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

// Shared by both the create and edit screens — only the submit handler and initial data
// differ between them.
export function TestimonialForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: TestimonialFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      customerName: form.customerName,
      rating: form.rating,
      reviewText: form.reviewText,
      avatarPublicId: form.avatarPublicId || null,
      serviceReceived: form.serviceReceived || null,
      receivedAt: form.receivedAt || null,
      isFeatured: form.isFeatured,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Testimonial details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='customerName'>Customer name</Label>
            <Input
              id='customerName'
              value={form.customerName}
              onChange={(e) => setField('customerName', e.target.value)}
              required
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Rating</Label>
            <RatingInput value={form.rating} onChange={(rating) => setField('rating', rating)} />
          </div>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label htmlFor='reviewText'>Review</Label>
            <Textarea
              id='reviewText'
              value={form.reviewText}
              onChange={(e) => setField('reviewText', e.target.value)}
              required
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='serviceReceived'>Service received</Label>
            <Input
              id='serviceReceived'
              value={form.serviceReceived}
              onChange={(e) => setField('serviceReceived', e.target.value)}
              placeholder='e.g. Full Respray'
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='receivedAt'>Service date</Label>
            <Input
              id='receivedAt'
              type='date'
              value={form.receivedAt}
              onChange={(e) => setField('receivedAt', e.target.value)}
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
            <Label>Avatar (optional)</Label>
            <CloudinaryUpload
              mode='single-image'
              folder='vantage/testimonials'
              value={form.avatarPublicId || null}
              onChange={(value) => setField('avatarPublicId', typeof value === 'string' ? value : '')}
            />
          </div>
        </CardContent>
      </Card>

      {submitError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.testimonials.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
