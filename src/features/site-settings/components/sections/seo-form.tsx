'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { useUpdateSeo } from '../../hooks/api/mutation/use-update-seo';
import { updateSeoSchema } from '@/validations/site-settings-schema';
import type { SiteSettings, UpdateSeoInput } from '../../types';

type FormValues = UpdateSeoInput;

function toFormValues(data: SiteSettings | null): FormValues {
  return {
    metaTitle: data?.metaTitle ?? '',
    metaDescription: data?.metaDescription ?? '',
    ogImagePublicId: data?.ogImagePublicId ?? '',
    twitterHandle: data?.twitterHandle ?? '',
  };
}

// Site-wide fallback metadata — the root layout and every public page inherit these
// (title template, description, OG/Twitter image) until a page sets its own.
export function SeoForm({ initialData }: { initialData: SiteSettings | null }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateSeoSchema),
    defaultValues: toFormValues(initialData),
  });
  const updateSeo = useUpdateSeo();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateSeo.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>
            Default title, description and share image used across the public site and search results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.metaTitle}>
              <FieldLabel htmlFor='metaTitle'>Meta title</FieldLabel>
              <Input id='metaTitle' aria-invalid={!!errors.metaTitle} {...register('metaTitle')} />
              <FieldError errors={[errors.metaTitle]} />
            </Field>
            <Field data-invalid={!!errors.metaDescription}>
              <FieldLabel htmlFor='metaDescription'>Meta description</FieldLabel>
              <Textarea id='metaDescription' aria-invalid={!!errors.metaDescription} {...register('metaDescription')} />
              <FieldError errors={[errors.metaDescription]} />
            </Field>
            <Field data-invalid={!!errors.twitterHandle}>
              <FieldLabel htmlFor='twitterHandle'>Twitter/X handle</FieldLabel>
              <Input
                id='twitterHandle'
                placeholder='@yourbrand'
                aria-invalid={!!errors.twitterHandle}
                {...register('twitterHandle')}
              />
              <FieldError errors={[errors.twitterHandle]} />
            </Field>
            <Field>
              <FieldLabel>Share image (Open Graph / Twitter)</FieldLabel>
              <Controller
                control={control}
                name='ogImagePublicId'
                render={({ field }) => (
                  <CloudinaryUpload
                    mode='single-image'
                    folder='vantage/seo'
                    value={field.value || null}
                    onChange={(v) => field.onChange((v as string) ?? '')}
                  />
                )}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {updateSeo.isError && <p className='mt-3 text-sm text-destructive'>{updateSeo.error.message}</p>}

      <div className='mt-4 flex items-center gap-3'>
        <Button type='submit' disabled={updateSeo.isPending}>
          {updateSeo.isPending ? 'Saving…' : 'Save'}
        </Button>
        {saved && !updateSeo.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
      </div>
    </form>
  );
}
