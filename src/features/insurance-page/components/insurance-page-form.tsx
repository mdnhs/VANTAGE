'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateInsurancePage } from '@/features/site-settings/hooks/api/mutation/use-update-insurance-page';
import type { InsuranceContent } from '../defaults';

interface FormValues {
  heroEyebrow: string;
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  heroSubtext: string;
  coordinationTitle: string;
  coordinationSubtext: string;
  features: { title: string; description: string }[];
  stepsEyebrow: string;
  stepsTitle: string;
  steps: { label: string; description: string }[];
  ctaLine1: string;
  ctaAccent: string;
  ctaSubtext: string;
  disclaimer: string;
}

function Text({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className='flex flex-col gap-1.5'>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}

export function InsurancePageForm({ initialContent }: { initialContent: InsuranceContent }) {
  const { register, handleSubmit, control } = useForm<FormValues>({ defaultValues: initialContent });
  const features = useFieldArray({ control, name: 'features' });
  const steps = useFieldArray({ control, name: 'steps' });
  const update = useUpdateInsurancePage();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((v) => {
    setSaved(false);
    update.mutate(
      {
        insuranceHeroEyebrow: v.heroEyebrow,
        insuranceHeroLine1: v.heroLine1,
        insuranceHeroLine2: v.heroLine2,
        insuranceHeroLine3: v.heroLine3,
        insuranceHeroSubtext: v.heroSubtext,
        insuranceCoordinationTitle: v.coordinationTitle,
        insuranceCoordinationSubtext: v.coordinationSubtext,
        insuranceFeatures: v.features.filter((f) => f.title.trim() && f.description.trim()),
        insuranceStepsEyebrow: v.stepsEyebrow,
        insuranceStepsTitle: v.stepsTitle,
        insuranceSteps: v.steps.filter((s) => s.label.trim() && s.description.trim()),
        insuranceCtaLine1: v.ctaLine1,
        insuranceCtaAccent: v.ctaAccent,
        insuranceCtaSubtext: v.ctaSubtext,
        insuranceDisclaimer: v.disclaimer,
      },
      { onSuccess: () => setSaved(true) },
    );
  });

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-3'>
          <div className='sm:col-span-3'>
            <Text label='Eyebrow' {...register('heroEyebrow')} />
          </div>
          <Text label='Headline line 1' {...register('heroLine1')} />
          <Text label='Headline line 2' {...register('heroLine2')} />
          <Text label='Headline line 3' {...register('heroLine3')} />
          <div className='flex flex-col gap-1.5 sm:col-span-3'>
            <Label>Description</Label>
            <Textarea {...register('heroSubtext')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordination cards</CardTitle>
          <CardDescription>Icons are fixed by position (first three cards).</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <Text label='Section title' {...register('coordinationTitle')} />
          <div className='flex flex-col gap-1.5'>
            <Label>Section description</Label>
            <Textarea {...register('coordinationSubtext')} />
          </div>
          {features.fields.map((field, index) => (
            <div key={field.id} className='flex flex-col gap-2 rounded-lg border border-border p-4'>
              <div className='flex items-end gap-2'>
                <div className='flex-1'>
                  <Text label={`Card ${index + 1} title`} {...register(`features.${index}.title`)} />
                </div>
                <Button type='button' variant='ghost' size='icon' onClick={() => features.remove(index)}>
                  <Trash2 className='size-4' />
                </Button>
              </div>
              <Textarea {...register(`features.${index}.description`)} />
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            className='w-fit'
            disabled={features.fields.length >= 6}
            onClick={() => features.append({ title: '', description: '' })}
          >
            <Plus className='size-4' /> Add card
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Process steps</CardTitle>
          <CardDescription>Step numbers follow the order below.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Text label='Eyebrow' {...register('stepsEyebrow')} />
            <Text label='Title' {...register('stepsTitle')} />
          </div>
          {steps.fields.map((field, index) => (
            <div key={field.id} className='flex items-start gap-2 rounded-lg border border-border p-4'>
              <span className='pt-8 font-mono text-sm text-muted-foreground'>{String(index + 1).padStart(2, '0')}</span>
              <div className='flex flex-1 flex-col gap-2'>
                <Text label='Label' {...register(`steps.${index}.label`)} />
                <Textarea {...register(`steps.${index}.description`)} />
              </div>
              <Button type='button' variant='ghost' size='icon' className='mt-6' onClick={() => steps.remove(index)}>
                <Trash2 className='size-4' />
              </Button>
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            className='w-fit'
            disabled={steps.fields.length >= 12}
            onClick={() => steps.append({ label: '', description: '' })}
          >
            <Plus className='size-4' /> Add step
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call to action &amp; disclaimer</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Text label='Headline line 1' {...register('ctaLine1')} />
            <Text label='Headline accent' {...register('ctaAccent')} />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Description</Label>
            <Textarea {...register('ctaSubtext')} />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label>Disclaimer</Label>
            <Textarea rows={4} {...register('disclaimer')} />
          </div>
        </CardContent>
      </Card>

      {update.isError && <p className='text-sm text-destructive'>{update.error.message}</p>}
      {saved && <p className='text-sm text-emerald-600'>Saved.</p>}
      <div>
        <Button type='submit' disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save insurance page'}
        </Button>
      </div>
    </form>
  );
}
