'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { useUpdateSiteSettings } from '../hooks/api/mutation/use-update-site-settings';
import type { SiteSettings, UpdateSiteSettingsInput } from '../types';

interface SettingsFormProps {
  initialData: SiteSettings | null;
}

type FormState = Record<Exclude<keyof UpdateSiteSettingsInput, 'heroVideoEnabled'>, string> & {
  heroVideoEnabled: boolean;
};

function toFormState(data: SiteSettings | null): FormState {
  return {
    businessName: data?.businessName ?? '',
    phone: data?.phone ?? '',
    emergencyPhone: data?.emergencyPhone ?? '',
    email: data?.email ?? '',
    address: data?.address ?? '',
    openingHours: data?.openingHours ?? '',
    googleMapsUrl: data?.googleMapsUrl ?? '',
    whatsappNumber: data?.whatsappNumber ?? '',
    facebookUrl: data?.facebookUrl ?? '',
    instagramUrl: data?.instagramUrl ?? '',
    tiktokUrl: data?.tiktokUrl ?? '',
    linkedinUrl: data?.linkedinUrl ?? '',
    logoPublicId: data?.logoPublicId ?? '',
    faviconPublicId: data?.faviconPublicId ?? '',
    heroVideoPublicId: data?.heroVideoPublicId ?? '',
    heroFallbackImagePublicId: data?.heroFallbackImagePublicId ?? '',
    heroVideoEnabled: data?.heroVideoEnabled ?? false,
  };
}

// Single big form for the settings singleton — no list/create/delete, so this component owns
// the whole edit lifecycle rather than being split by-field like a CRUD feature would be.
export function SettingsForm({ initialData }: SettingsFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const updateSettings = useUpdateSiteSettings();
  const [saved, setSaved] = useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(form as UpdateSiteSettingsInput, {
      onSuccess: () => setSaved(true),
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Business info</CardTitle>
          <CardDescription>Core identity shown across the site and dashboard.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='businessName'>Business name</Label>
            <Input
              id='businessName'
              value={form.businessName}
              onChange={(e) => setField('businessName', e.target.value)}
              required
            />
          </div>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label htmlFor='openingHours'>Opening hours</Label>
            <Textarea
              id='openingHours'
              value={form.openingHours}
              onChange={(e) => setField('openingHours', e.target.value)}
              required
            />
          </div>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label htmlFor='address'>Address</Label>
            <Textarea
              id='address'
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>Phone, email and map link shown on the marketing site.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='phone'>Phone</Label>
            <Input id='phone' value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='emergencyPhone'>Emergency phone</Label>
            <Input
              id='emergencyPhone'
              value={form.emergencyPhone}
              onChange={(e) => setField('emergencyPhone', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              required
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='whatsappNumber'>WhatsApp number</Label>
            <Input
              id='whatsappNumber'
              value={form.whatsappNumber}
              onChange={(e) => setField('whatsappNumber', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label htmlFor='googleMapsUrl'>Google Maps URL</Label>
            <Input
              id='googleMapsUrl'
              type='url'
              value={form.googleMapsUrl}
              onChange={(e) => setField('googleMapsUrl', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
          <CardDescription>Leave blank to hide an icon from the footer.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='facebookUrl'>Facebook URL</Label>
            <Input
              id='facebookUrl'
              type='url'
              value={form.facebookUrl}
              onChange={(e) => setField('facebookUrl', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='instagramUrl'>Instagram URL</Label>
            <Input
              id='instagramUrl'
              type='url'
              value={form.instagramUrl}
              onChange={(e) => setField('instagramUrl', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='tiktokUrl'>TikTok URL</Label>
            <Input
              id='tiktokUrl'
              type='url'
              value={form.tiktokUrl}
              onChange={(e) => setField('tiktokUrl', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='linkedinUrl'>LinkedIn URL</Label>
            <Input
              id='linkedinUrl'
              type='url'
              value={form.linkedinUrl}
              onChange={(e) => setField('linkedinUrl', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero media</CardTitle>
          <CardDescription>Logo, favicon and the homepage hero video/fallback image.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5'>
            <Label>Logo</Label>
            <CloudinaryUpload
              mode='single-image'
              folder='vantage/branding'
              value={form.logoPublicId || null}
              onChange={(v) => setField('logoPublicId', (v as string) ?? '')}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Favicon</Label>
            <CloudinaryUpload
              mode='single-image'
              folder='vantage/branding'
              value={form.faviconPublicId || null}
              onChange={(v) => setField('faviconPublicId', (v as string) ?? '')}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Hero fallback image</Label>
            <CloudinaryUpload
              mode='single-image'
              folder='vantage/hero'
              value={form.heroFallbackImagePublicId || null}
              onChange={(v) => setField('heroFallbackImagePublicId', (v as string) ?? '')}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Hero video</Label>
            <CloudinaryUpload
              mode='video'
              folder='vantage/hero/video'
              value={form.heroVideoPublicId || null}
              onChange={(v) => setField('heroVideoPublicId', (v as string) ?? '')}
            />
          </div>
          <div className='flex items-center gap-3 sm:col-span-2'>
            <Switch
              id='heroVideoEnabled'
              checked={form.heroVideoEnabled}
              onCheckedChange={(checked) => setField('heroVideoEnabled', checked)}
            />
            <Label htmlFor='heroVideoEnabled'>Play hero video instead of the fallback image</Label>
          </div>
        </CardContent>
      </Card>

      {updateSettings.isError && <p className='text-sm text-destructive'>{updateSettings.error.message}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Saving…' : 'Save settings'}
        </Button>
        {saved && !updateSettings.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
      </div>
    </form>
  );
}
