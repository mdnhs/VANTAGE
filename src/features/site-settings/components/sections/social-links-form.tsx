'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useUpdateSocialLinks } from '../../hooks/api/mutation/use-update-social-links';
import { updateSocialLinksSchema } from '@/validations/site-settings-schema';
import type { SiteSettings, UpdateSocialLinksInput } from '../../types';

type FormValues = UpdateSocialLinksInput;

function toFormValues(data: SiteSettings | null): FormValues {
  return {
    facebookUrl: data?.facebookUrl ?? '',
    instagramUrl: data?.instagramUrl ?? '',
    tiktokUrl: data?.tiktokUrl ?? '',
    linkedinUrl: data?.linkedinUrl ?? '',
  };
}

export function SocialLinksForm({ initialData }: { initialData: SiteSettings | null }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateSocialLinksSchema),
    defaultValues: toFormValues(initialData),
  });
  const updateSocialLinks = useUpdateSocialLinks();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateSocialLinks.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
          <CardDescription>Leave blank to hide an icon from the footer.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.facebookUrl}>
              <FieldLabel htmlFor='facebookUrl'>Facebook URL</FieldLabel>
              <Input id='facebookUrl' type='url' aria-invalid={!!errors.facebookUrl} {...register('facebookUrl')} />
              <FieldError errors={[errors.facebookUrl]} />
            </Field>
            <Field data-invalid={!!errors.instagramUrl}>
              <FieldLabel htmlFor='instagramUrl'>Instagram URL</FieldLabel>
              <Input id='instagramUrl' type='url' aria-invalid={!!errors.instagramUrl} {...register('instagramUrl')} />
              <FieldError errors={[errors.instagramUrl]} />
            </Field>
            <Field data-invalid={!!errors.tiktokUrl}>
              <FieldLabel htmlFor='tiktokUrl'>TikTok URL</FieldLabel>
              <Input id='tiktokUrl' type='url' aria-invalid={!!errors.tiktokUrl} {...register('tiktokUrl')} />
              <FieldError errors={[errors.tiktokUrl]} />
            </Field>
            <Field data-invalid={!!errors.linkedinUrl}>
              <FieldLabel htmlFor='linkedinUrl'>LinkedIn URL</FieldLabel>
              <Input id='linkedinUrl' type='url' aria-invalid={!!errors.linkedinUrl} {...register('linkedinUrl')} />
              <FieldError errors={[errors.linkedinUrl]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {updateSocialLinks.isError && <p className='mt-3 text-sm text-destructive'>{updateSocialLinks.error.message}</p>}

      <div className='mt-4 flex items-center gap-3'>
        <Button type='submit' disabled={updateSocialLinks.isPending}>
          {updateSocialLinks.isPending ? 'Saving…' : 'Save'}
        </Button>
        {saved && !updateSocialLinks.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
      </div>
    </form>
  );
}
