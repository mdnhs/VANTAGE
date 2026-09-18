'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useUpdateContact } from '../../hooks/api/mutation/use-update-contact';
import { updateContactSchema } from '@/validations/site-settings-schema';
import type { SiteSettings, UpdateContactInput } from '../../types';

type FormValues = UpdateContactInput;

function toFormValues(data: SiteSettings | null): FormValues {
  return {
    phone: data?.phone ?? '',
    emergencyPhone: data?.emergencyPhone ?? '',
    email: data?.email ?? '',
    whatsappNumber: data?.whatsappNumber ?? '',
    googleMapsUrl: data?.googleMapsUrl ?? '',
  };
}

export function ContactForm({ initialData }: { initialData: SiteSettings | null }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: toFormValues(initialData),
  });
  const updateContact = useUpdateContact();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateContact.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>Phone, email and map link shown on the marketing site.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor='phone'>Phone</FieldLabel>
              <Input id='phone' aria-invalid={!!errors.phone} {...register('phone')} />
              <FieldError errors={[errors.phone]} />
            </Field>
            <Field data-invalid={!!errors.emergencyPhone}>
              <FieldLabel htmlFor='emergencyPhone'>Emergency phone</FieldLabel>
              <Input id='emergencyPhone' aria-invalid={!!errors.emergencyPhone} {...register('emergencyPhone')} />
              <FieldError errors={[errors.emergencyPhone]} />
            </Field>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor='email'>Email</FieldLabel>
              <Input id='email' type='email' aria-invalid={!!errors.email} {...register('email')} />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.whatsappNumber}>
              <FieldLabel htmlFor='whatsappNumber'>WhatsApp number</FieldLabel>
              <Input id='whatsappNumber' aria-invalid={!!errors.whatsappNumber} {...register('whatsappNumber')} />
              <FieldError errors={[errors.whatsappNumber]} />
            </Field>
            <Field data-invalid={!!errors.googleMapsUrl}>
              <FieldLabel htmlFor='googleMapsUrl'>Google Maps URL</FieldLabel>
              <Input
                id='googleMapsUrl'
                type='url'
                aria-invalid={!!errors.googleMapsUrl}
                {...register('googleMapsUrl')}
              />
              <FieldError errors={[errors.googleMapsUrl]} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {updateContact.isError && <p className='mt-3 text-sm text-destructive'>{updateContact.error.message}</p>}

      <div className='mt-4 flex items-center gap-3'>
        <Button type='submit' disabled={updateContact.isPending}>
          {updateContact.isPending ? 'Saving…' : 'Save'}
        </Button>
        {saved && !updateContact.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
      </div>
    </form>
  );
}
