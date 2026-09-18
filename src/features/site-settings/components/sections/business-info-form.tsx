'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateBusinessInfo } from '../../hooks/api/mutation/use-update-business-info';
import { updateBusinessInfoSchema } from '@/validations/site-settings-schema';
import { OpeningHoursField } from './opening-hours-field';
import type { SiteSettings, UpdateBusinessInfoInput } from '../../types';

type FormValues = UpdateBusinessInfoInput;

function toFormValues(data: SiteSettings | null): FormValues {
  return {
    businessName: data?.businessName ?? '',
    openingHours: data?.openingHours ?? '',
    address: data?.address ?? '',
  };
}

// Every field can be saved blank — validation only enforces format (max length), never
// "required", since this is a singleton row an admin fills in over time.
export function BusinessInfoForm({ initialData }: { initialData: SiteSettings | null }) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateBusinessInfoSchema),
    defaultValues: toFormValues(initialData),
  });
  const updateBusinessInfo = useUpdateBusinessInfo();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialData) {
      reset(toFormValues(initialData));
    }
  }, [initialData, reset]);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateBusinessInfo.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Business info</CardTitle>
          <CardDescription>Core identity and operating hours shown across the site and dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.businessName}>
              <FieldLabel htmlFor='businessName'>Business name</FieldLabel>
              <Input id='businessName' aria-invalid={!!errors.businessName} {...register('businessName')} />
              <FieldError errors={[errors.businessName]} />
            </Field>
            <Field data-invalid={!!errors.address}>
              <FieldLabel htmlFor='address'>Address</FieldLabel>
              <Textarea id='address' aria-invalid={!!errors.address} {...register('address')} />
              <FieldError errors={[errors.address]} />
            </Field>
            <Field>
              <FieldLabel>Opening hours</FieldLabel>
              <Controller
                control={control}
                name='openingHours'
                render={({ field }) => <OpeningHoursField value={field.value} onChange={field.onChange} />}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {updateBusinessInfo.isError && <p className='text-sm text-destructive'>{updateBusinessInfo.error.message}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={updateBusinessInfo.isPending}>
          {updateBusinessInfo.isPending ? 'Saving…' : 'Save'}
        </Button>
        {saved && !updateBusinessInfo.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
      </div>
    </form>
  );
}
