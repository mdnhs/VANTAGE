'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { useUpdateHomepageCatalog } from '@/features/site-settings/hooks/api/mutation/use-update-homepage-catalog';
import { updateHomepageCatalogSchema, type UpdateHomepageCatalogInput } from '@/validations/site-settings-schema';
import { HomepageCatalogTable } from '@/features/homepage-catalogs/components/list/homepage-catalog-table';
import type { SiteSettings } from '@/features/site-settings/types';
import type { HomepageCatalog } from '@/features/homepage-catalogs/types';

interface CatalogPanelProps {
  settings: SiteSettings | null;
  catalogItems: { data: HomepageCatalog[]; total: number };
}

function toCatalogFormValues(data: SiteSettings | null): UpdateHomepageCatalogInput {
  return {
    catalogEyebrow: data?.catalogEyebrow ?? 'Specialist Autobody Divisions',
    catalogHeadlineLine1: data?.catalogHeadlineLine1 ?? 'From Damage To',
    catalogHeadlineAccent: data?.catalogHeadlineAccent ?? 'Showroom Finish.',
    catalogSubtext:
      data?.catalogSubtext ??
      'Comprehensive automotive bodywork, structural restoration, and cosmetic refinement using factory-approved techniques.',
  };
}

export function CatalogPanel({ settings, catalogItems }: CatalogPanelProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateHomepageCatalogInput>({
    resolver: zodResolver(updateHomepageCatalogSchema),
    defaultValues: toCatalogFormValues(settings),
  });

  const updateHomepageCatalog = useUpdateHomepageCatalog();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateHomepageCatalog.mutate(values, { onSuccess: () => setSaved(true) });
  });

  return (
    <div className='flex flex-col gap-8'>
      {/* Section Header Copy */}
      <form onSubmit={onSubmit} noValidate className='flex flex-col gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Catalog header copy</CardTitle>
            <CardDescription>
              The eyebrow badge, headline, accent line, and description shown above the homepage catalog grid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!errors.catalogEyebrow}>
                <FieldLabel htmlFor='catalogEyebrow'>Eyebrow badge text</FieldLabel>
                <Input
                  id='catalogEyebrow'
                  aria-invalid={!!errors.catalogEyebrow}
                  {...register('catalogEyebrow')}
                  placeholder='Specialist Autobody Divisions'
                />
                <FieldError errors={[errors.catalogEyebrow]} />
              </Field>

              <div className='grid gap-4 sm:grid-cols-2'>
                <Field data-invalid={!!errors.catalogHeadlineLine1}>
                  <FieldLabel htmlFor='catalogHeadlineLine1'>Headline line 1</FieldLabel>
                  <Input
                    id='catalogHeadlineLine1'
                    aria-invalid={!!errors.catalogHeadlineLine1}
                    {...register('catalogHeadlineLine1')}
                    placeholder='From Damage To'
                  />
                  <FieldError errors={[errors.catalogHeadlineLine1]} />
                </Field>

                <Field data-invalid={!!errors.catalogHeadlineAccent}>
                  <FieldLabel htmlFor='catalogHeadlineAccent'>Headline accent line</FieldLabel>
                  <Input
                    id='catalogHeadlineAccent'
                    aria-invalid={!!errors.catalogHeadlineAccent}
                    {...register('catalogHeadlineAccent')}
                    placeholder='Showroom Finish.'
                  />
                  <FieldError errors={[errors.catalogHeadlineAccent]} />
                </Field>
              </div>

              <Field data-invalid={!!errors.catalogSubtext}>
                <FieldLabel htmlFor='catalogSubtext'>Description subtext</FieldLabel>
                <Textarea
                  id='catalogSubtext'
                  aria-invalid={!!errors.catalogSubtext}
                  {...register('catalogSubtext')}
                  placeholder='Comprehensive automotive bodywork, structural restoration...'
                />
                <FieldError errors={[errors.catalogSubtext]} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {updateHomepageCatalog.isError && (
          <p className='text-sm text-destructive'>{updateHomepageCatalog.error.message}</p>
        )}

        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={updateHomepageCatalog.isPending}>
            {updateHomepageCatalog.isPending ? 'Saving…' : 'Save header copy'}
          </Button>
          {saved && !updateHomepageCatalog.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
        </div>
      </form>

      {/* Catalog Services Items */}
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-base font-semibold'>Catalog items</h2>
            <p className='text-sm text-muted-foreground'>
              The services shown in the homepage catalog grid, in display order.
            </p>
          </div>
          <Link href={APP_ROUTES.content.homepageCatalogs.create} className={cn(buttonVariants())}>
            Add catalog item
          </Link>
        </div>

        <HomepageCatalogTable initialData={catalogItems} />
      </div>
    </div>
  );
}
