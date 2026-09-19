'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { useUpdateHomepageHero } from '@/features/site-settings/hooks/api/mutation/use-update-homepage-hero';
import { updateHomepageHeroSchema } from '@/validations/site-settings-schema';
import { toHeroFormValues, type HeroFormValues } from './hero-form-values';
import type { SiteSettings } from '@/features/site-settings/types';

// Homepage hero copy + the 4 trust-ticker items shown under the CTAs. Icons for the trust
// items stay hardcoded in stitch-hero.tsx (Star/Landmark/BadgeCheck/Car, in this order) —
// only the title/subtitle text is CMS-driven.
export function HeroForm({ initialData }: { initialData: SiteSettings | null }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HeroFormValues>({
    resolver: zodResolver(updateHomepageHeroSchema),
    defaultValues: toHeroFormValues(initialData),
  });
  const updateHomepageHero = useUpdateHomepageHero();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateHomepageHero.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Hero copy</CardTitle>
          <CardDescription>The eyebrow badge, headline and subtext shown in the homepage hero.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.heroEyebrow}>
              <FieldLabel htmlFor='heroEyebrow'>Eyebrow badge text</FieldLabel>
              <Input id='heroEyebrow' aria-invalid={!!errors.heroEyebrow} {...register('heroEyebrow')} />
              <FieldError errors={[errors.heroEyebrow]} />
            </Field>
            <div className='grid gap-4 sm:grid-cols-3'>
              <Field data-invalid={!!errors.heroHeadlineLine1}>
                <FieldLabel htmlFor='heroHeadlineLine1'>Headline line 1</FieldLabel>
                <Input
                  id='heroHeadlineLine1'
                  aria-invalid={!!errors.heroHeadlineLine1}
                  {...register('heroHeadlineLine1')}
                />
                <FieldError errors={[errors.heroHeadlineLine1]} />
              </Field>
              <Field data-invalid={!!errors.heroHeadlineLine2}>
                <FieldLabel htmlFor='heroHeadlineLine2'>Headline line 2</FieldLabel>
                <Input
                  id='heroHeadlineLine2'
                  aria-invalid={!!errors.heroHeadlineLine2}
                  {...register('heroHeadlineLine2')}
                />
                <FieldError errors={[errors.heroHeadlineLine2]} />
              </Field>
              <Field data-invalid={!!errors.heroHeadlineAccent}>
                <FieldLabel htmlFor='heroHeadlineAccent'>Headline accent line</FieldLabel>
                <Input
                  id='heroHeadlineAccent'
                  aria-invalid={!!errors.heroHeadlineAccent}
                  {...register('heroHeadlineAccent')}
                />
                <FieldError errors={[errors.heroHeadlineAccent]} />
              </Field>
            </div>
            <Field data-invalid={!!errors.heroSubtext}>
              <FieldLabel htmlFor='heroSubtext'>Subtext</FieldLabel>
              <Textarea id='heroSubtext' aria-invalid={!!errors.heroSubtext} {...register('heroSubtext')} />
              <FieldError errors={[errors.heroSubtext]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero media</CardTitle>
          <CardDescription>Homepage hero fallback image and background video.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
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

      <Card>
        <CardHeader>
          <CardTitle>Trust badges</CardTitle>
          <CardDescription>
            The 4 items in the trust ticker under the hero CTAs. Icons and colors are fixed (Star, Landmark, BadgeCheck,
            Car, in this order) — only the text below is editable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {([1, 2, 3, 4] as const).map((n) => {
              const titleKey = `trustBadge${n}Title` as const;
              const subtitleKey = `trustBadge${n}Subtitle` as const;
              return (
                <div
                  key={n}
                  className='grid gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0 sm:grid-cols-2'
                >
                  <Field data-invalid={!!errors[titleKey]}>
                    <FieldLabel htmlFor={titleKey}>Badge {n} title</FieldLabel>
                    <Input id={titleKey} aria-invalid={!!errors[titleKey]} {...register(titleKey)} />
                    <FieldError errors={[errors[titleKey]]} />
                  </Field>
                  <Field data-invalid={!!errors[subtitleKey]}>
                    <FieldLabel htmlFor={subtitleKey}>Badge {n} subtitle</FieldLabel>
                    <Input id={subtitleKey} aria-invalid={!!errors[subtitleKey]} {...register(subtitleKey)} />
                    <FieldError errors={[errors[subtitleKey]]} />
                  </Field>
                </div>
              );
            })}
          </FieldGroup>
        </CardContent>
      </Card>

      {updateHomepageHero.isError && <p className='text-sm text-destructive'>{updateHomepageHero.error.message}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={updateHomepageHero.isPending}>
          {updateHomepageHero.isPending ? 'Saving…' : 'Save'}
        </Button>
        {saved && !updateHomepageHero.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
      </div>
    </form>
  );
}
