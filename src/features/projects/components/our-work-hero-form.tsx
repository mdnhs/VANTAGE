'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateOurWorkHero } from '@/features/site-settings/hooks/api/mutation/use-update-our-work-hero';
import { updateOurWorkHeroSchema, type UpdateOurWorkHeroInput } from '@/validations/site-settings-schema';
import type { SiteSettings } from '@/features/site-settings/types';

function toFormValues(data: SiteSettings | null): UpdateOurWorkHeroInput {
  return {
    ourWorkHeroEyebrow: data?.ourWorkHeroEyebrow ?? 'Portfolio',
    ourWorkHeroHeadlineLine1: data?.ourWorkHeroHeadlineLine1 ?? 'Our Recent',
    ourWorkHeroHeadlineAccent: data?.ourWorkHeroHeadlineAccent ?? 'Restorations.',
    ourWorkHeroSubtext:
      data?.ourWorkHeroSubtext ??
      'Explore a curated selection of our most challenging and rewarding projects. Precision engineering meets master craftsmanship.',
  };
}

export function OurWorkHeroForm({ settings }: { settings: SiteSettings | null }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateOurWorkHeroInput>({
    resolver: zodResolver(updateOurWorkHeroSchema),
    defaultValues: toFormValues(settings),
  });

  const updateOurWorkHero = useUpdateOurWorkHero();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateOurWorkHero.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Page hero copy</CardTitle>
          <CardDescription>
            The eyebrow, headline and description shown at the top of the public Our Work page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.ourWorkHeroEyebrow}>
              <FieldLabel htmlFor='ourWorkHeroEyebrow'>Eyebrow text</FieldLabel>
              <Input
                id='ourWorkHeroEyebrow'
                aria-invalid={!!errors.ourWorkHeroEyebrow}
                {...register('ourWorkHeroEyebrow')}
              />
              <FieldError errors={[errors.ourWorkHeroEyebrow]} />
            </Field>

            <div className='grid gap-4 sm:grid-cols-2'>
              <Field data-invalid={!!errors.ourWorkHeroHeadlineLine1}>
                <FieldLabel htmlFor='ourWorkHeroHeadlineLine1'>Headline line 1</FieldLabel>
                <Input
                  id='ourWorkHeroHeadlineLine1'
                  aria-invalid={!!errors.ourWorkHeroHeadlineLine1}
                  {...register('ourWorkHeroHeadlineLine1')}
                />
                <FieldError errors={[errors.ourWorkHeroHeadlineLine1]} />
              </Field>

              <Field data-invalid={!!errors.ourWorkHeroHeadlineAccent}>
                <FieldLabel htmlFor='ourWorkHeroHeadlineAccent'>Headline accent line</FieldLabel>
                <Input
                  id='ourWorkHeroHeadlineAccent'
                  aria-invalid={!!errors.ourWorkHeroHeadlineAccent}
                  {...register('ourWorkHeroHeadlineAccent')}
                />
                <FieldError errors={[errors.ourWorkHeroHeadlineAccent]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.ourWorkHeroSubtext}>
              <FieldLabel htmlFor='ourWorkHeroSubtext'>Description</FieldLabel>
              <Textarea
                id='ourWorkHeroSubtext'
                aria-invalid={!!errors.ourWorkHeroSubtext}
                {...register('ourWorkHeroSubtext')}
              />
              <FieldError errors={[errors.ourWorkHeroSubtext]} />
            </Field>

            {updateOurWorkHero.isError && <p className='text-sm text-destructive'>{updateOurWorkHero.error.message}</p>}
            {saved && <p className='text-sm text-emerald-600'>Saved.</p>}

            <div>
              <Button type='submit' disabled={updateOurWorkHero.isPending}>
                {updateOurWorkHero.isPending ? 'Saving…' : 'Save hero copy'}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
