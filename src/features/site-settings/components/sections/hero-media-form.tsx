'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { useUpdateHeroMedia } from '../../hooks/api/mutation/use-update-hero-media';
import { updateHeroMediaSchema } from '@/validations/site-settings-schema';
import type { SiteSettings, UpdateHeroMediaInput } from '../../types';

type FormValues = UpdateHeroMediaInput;

function toFormValues(data: SiteSettings | null): FormValues {
  return {
    logoPublicId: data?.logoPublicId ?? '',
    faviconPublicId: data?.faviconPublicId ?? '',
    heroVideoPublicId: data?.heroVideoPublicId ?? '',
    heroFallbackImagePublicId: data?.heroFallbackImagePublicId ?? '',
    heroVideoEnabled: data?.heroVideoEnabled ?? false,
  };
}

export function HeroMediaForm({ initialData }: { initialData: SiteSettings | null }) {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(updateHeroMediaSchema),
    defaultValues: toFormValues(initialData),
  });
  const updateHeroMedia = useUpdateHeroMedia();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateHeroMedia.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Hero media</CardTitle>
          <CardDescription>Logo, favicon and the homepage hero video/fallback image.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <Controller
                control={control}
                name='logoPublicId'
                render={({ field }) => (
                  <CloudinaryUpload
                    mode='single-image'
                    folder='vantage/branding'
                    value={field.value || null}
                    onChange={(v) => field.onChange((v as string) ?? '')}
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Favicon</FieldLabel>
              <Controller
                control={control}
                name='faviconPublicId'
                render={({ field }) => (
                  <CloudinaryUpload
                    mode='single-image'
                    folder='vantage/branding'
                    value={field.value || null}
                    onChange={(v) => field.onChange((v as string) ?? '')}
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Hero fallback image</FieldLabel>
              <Controller
                control={control}
                name='heroFallbackImagePublicId'
                render={({ field }) => (
                  <CloudinaryUpload
                    mode='single-image'
                    folder='vantage/hero'
                    value={field.value || null}
                    onChange={(v) => field.onChange((v as string) ?? '')}
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Hero video</FieldLabel>
              <Controller
                control={control}
                name='heroVideoPublicId'
                render={({ field }) => (
                  <CloudinaryUpload
                    mode='video'
                    folder='vantage/hero/video'
                    value={field.value || null}
                    onChange={(v) => field.onChange((v as string) ?? '')}
                  />
                )}
              />
            </Field>
            <Field orientation='horizontal'>
              <Controller
                control={control}
                name='heroVideoEnabled'
                render={({ field }) => (
                  <Switch id='heroVideoEnabled' checked={field.value ?? false} onCheckedChange={field.onChange} />
                )}
              />
              <FieldLabel htmlFor='heroVideoEnabled'>Play hero video instead of the fallback image</FieldLabel>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {updateHeroMedia.isError && <p className='mt-3 text-sm text-destructive'>{updateHeroMedia.error.message}</p>}

      <div className='mt-4 flex items-center gap-3'>
        <Button type='submit' disabled={updateHeroMedia.isPending}>
          {updateHeroMedia.isPending ? 'Saving…' : 'Save'}
        </Button>
        {saved && !updateHeroMedia.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
      </div>
    </form>
  );
}
