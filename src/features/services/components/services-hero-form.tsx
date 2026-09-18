'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateServicesHero } from '@/features/site-settings/hooks/api/mutation/use-update-services-hero';
import { updateServicesHeroSchema, type UpdateServicesHeroInput } from '@/validations/site-settings-schema';
import type { SiteSettings } from '@/features/site-settings/types';

function toFormValues(data: SiteSettings | null): UpdateServicesHeroInput {
  return {
    servicesHeroEyebrow: data?.servicesHeroEyebrow ?? 'Master Craftsmanship',
    servicesHeroHeadlineLine1: data?.servicesHeroHeadlineLine1 ?? 'Professional Bodywork.',
    servicesHeroHeadlineAccent: data?.servicesHeroHeadlineAccent ?? 'Precision Finish.',
    servicesHeroSubtext:
      data?.servicesHeroSubtext ??
      'Our specialized services are engineered to restore your vehicle to factory perfection or elevate it beyond original specifications.',
  };
}

export function ServicesHeroForm({ settings }: { settings: SiteSettings | null }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateServicesHeroInput>({
    resolver: zodResolver(updateServicesHeroSchema),
    defaultValues: toFormValues(settings),
  });

  const updateServicesHero = useUpdateServicesHero();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateServicesHero.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Page hero copy</CardTitle>
          <CardDescription>
            The eyebrow, headline and description shown at the top of the public services page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.servicesHeroEyebrow}>
              <FieldLabel htmlFor='servicesHeroEyebrow'>Eyebrow text</FieldLabel>
              <Input
                id='servicesHeroEyebrow'
                aria-invalid={!!errors.servicesHeroEyebrow}
                {...register('servicesHeroEyebrow')}
              />
              <FieldError errors={[errors.servicesHeroEyebrow]} />
            </Field>

            <div className='grid gap-4 sm:grid-cols-2'>
              <Field data-invalid={!!errors.servicesHeroHeadlineLine1}>
                <FieldLabel htmlFor='servicesHeroHeadlineLine1'>Headline line 1</FieldLabel>
                <Input
                  id='servicesHeroHeadlineLine1'
                  aria-invalid={!!errors.servicesHeroHeadlineLine1}
                  {...register('servicesHeroHeadlineLine1')}
                />
                <FieldError errors={[errors.servicesHeroHeadlineLine1]} />
              </Field>

              <Field data-invalid={!!errors.servicesHeroHeadlineAccent}>
                <FieldLabel htmlFor='servicesHeroHeadlineAccent'>Headline accent line</FieldLabel>
                <Input
                  id='servicesHeroHeadlineAccent'
                  aria-invalid={!!errors.servicesHeroHeadlineAccent}
                  {...register('servicesHeroHeadlineAccent')}
                />
                <FieldError errors={[errors.servicesHeroHeadlineAccent]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.servicesHeroSubtext}>
              <FieldLabel htmlFor='servicesHeroSubtext'>Description</FieldLabel>
              <Textarea
                id='servicesHeroSubtext'
                aria-invalid={!!errors.servicesHeroSubtext}
                {...register('servicesHeroSubtext')}
              />
              <FieldError errors={[errors.servicesHeroSubtext]} />
            </Field>

            {updateServicesHero.isError && (
              <p className='text-sm text-destructive'>{updateServicesHero.error.message}</p>
            )}
            {saved && <p className='text-sm text-emerald-600'>Saved.</p>}

            <div>
              <Button type='submit' disabled={updateServicesHero.isPending}>
                {updateServicesHero.isPending ? 'Saving…' : 'Save hero copy'}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
