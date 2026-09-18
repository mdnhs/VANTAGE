'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { PartnerLogo } from '../types';

interface FormState {
  companyName: string;
  logoPublicId: string;
  websiteUrl: string;
  isEnabled: boolean;
}

function toFormState(data: PartnerLogo | null): FormState {
  return {
    companyName: data?.companyName ?? '',
    logoPublicId: data?.logoPublicId ?? '',
    websiteUrl: data?.websiteUrl ?? '',
    isEnabled: data?.isEnabled ?? true,
  };
}

interface PartnerLogoFormProps {
  initialData?: PartnerLogo | null;
  onSubmit: (input: {
    companyName: string;
    logoPublicId: string;
    websiteUrl: string;
    isEnabled: boolean;
  }) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

// Shared by both the create and edit screens — only the submit handler and initial data
// differ between them.
export function PartnerLogoForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: PartnerLogoFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      companyName: form.companyName,
      logoPublicId: form.logoPublicId,
      websiteUrl: form.websiteUrl,
      isEnabled: form.isEnabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Partner logo details</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='companyName'>Company name</Label>
            <Input
              id='companyName'
              value={form.companyName}
              onChange={(e) => setField('companyName', e.target.value)}
              required
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='websiteUrl'>Website URL</Label>
            <Input
              id='websiteUrl'
              type='url'
              value={form.websiteUrl}
              onChange={(e) => setField('websiteUrl', e.target.value)}
              placeholder='https://example.com'
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
            <Label>Logo</Label>
            <CloudinaryUpload
              mode='single-image'
              folder='vantage/partner-logos'
              value={form.logoPublicId || null}
              onChange={(v) => setField('logoPublicId', (v as string) ?? '')}
            />
          </div>
        </CardContent>
      </Card>

      {submitError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.partnerLogos.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
