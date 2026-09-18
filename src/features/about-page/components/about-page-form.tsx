'use client';

import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { useUpdateAboutPage } from '@/features/site-settings/hooks/api/mutation/use-update-about-page';
import type { AboutContent } from '../defaults';

type ImageField = 'heroImagePublicId' | 'heritageImagePublicId' | 'standardsImagePublicId';

function Text({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className='flex flex-col gap-1.5'>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}

export function AboutPageForm({ initialContent }: { initialContent: AboutContent }) {
  const { register, handleSubmit, control } = useForm<AboutContent>({ defaultValues: initialContent });
  const members = useFieldArray({ control, name: 'teamMembers' });
  const standards = useFieldArray({ control, name: 'standardsItems' });
  const update = useUpdateAboutPage();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((v) => {
    setSaved(false);
    update.mutate(
      {
        aboutHeroEyebrow: v.heroEyebrow,
        aboutHeroLine1: v.heroLine1,
        aboutHeroAccent1: v.heroAccent1,
        aboutHeroLine2: v.heroLine2,
        aboutHeroAccent2: v.heroAccent2,
        aboutHeroImagePublicId: v.heroImagePublicId ?? '',
        aboutHeritageTitle: v.heritageTitle,
        aboutHeritageText: v.heritageText,
        aboutHeritageStat1Value: v.heritageStat1Value,
        aboutHeritageStat1Label: v.heritageStat1Label,
        aboutHeritageStat2Value: v.heritageStat2Value,
        aboutHeritageStat2Label: v.heritageStat2Label,
        aboutHeritageImagePublicId: v.heritageImagePublicId ?? '',
        aboutHeritageQuote: v.heritageQuote,
        aboutTeamTitle: v.teamTitle,
        aboutTeamSubtext: v.teamSubtext,
        aboutTeamMembers: v.teamMembers
          .filter((m) => m.name.trim() && m.role.trim())
          .map((m) => ({ ...m, imagePublicId: m.imagePublicId || null })),
        aboutStandardsEyebrow: v.standardsEyebrow,
        aboutStandardsTitle: v.standardsTitle,
        aboutStandardsImagePublicId: v.standardsImagePublicId ?? '',
        aboutStandardsItems: v.standardsItems.filter((s) => s.title.trim() && s.description.trim()),
      },
      { onSuccess: () => setSaved(true) },
    );
  });

  const image = (name: ImageField, label: string) => (
    <div className='flex flex-col gap-1.5'>
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <CloudinaryUpload
            mode='single-image'
            folder='vantage/about'
            value={field.value || null}
            onChange={(v) => field.onChange((v as string) ?? null)}
          />
        )}
      />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <CardTitle>Hero</CardTitle>
          <CardDescription>Headline reads: line 1 + accent, line 2 + accent.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='sm:col-span-2'>
            <Text label='Eyebrow' {...register('heroEyebrow')} />
          </div>
          <Text label='Line 1' {...register('heroLine1')} />
          <Text label='Line 1 accent (red)' {...register('heroAccent1')} />
          <Text label='Line 2' {...register('heroLine2')} />
          <Text label='Line 2 accent (grey)' {...register('heroAccent2')} />
          <div className='sm:col-span-2'>{image('heroImagePublicId', 'Background image')}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Heritage</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          <div className='sm:col-span-2'>
            <Text label='Title' {...register('heritageTitle')} />
          </div>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label>Story</Label>
            <Textarea rows={4} {...register('heritageText')} />
          </div>
          <Text label='Stat 1 value' {...register('heritageStat1Value')} />
          <Text label='Stat 1 label' {...register('heritageStat1Label')} />
          <Text label='Stat 2 value' {...register('heritageStat2Value')} />
          <Text label='Stat 2 label' {...register('heritageStat2Label')} />
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label>Quote</Label>
            <Textarea {...register('heritageQuote')} />
          </div>
          <div className='sm:col-span-2'>{image('heritageImagePublicId', 'Image')}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <Text label='Title' {...register('teamTitle')} />
          <div className='flex flex-col gap-1.5'>
            <Label>Description</Label>
            <Textarea {...register('teamSubtext')} />
          </div>
          {members.fields.map((field, index) => (
            <div key={field.id} className='flex flex-col gap-3 rounded-lg border border-border p-4'>
              <div className='flex items-end gap-2'>
                <div className='grid flex-1 gap-3 sm:grid-cols-2'>
                  <Text label='Name' {...register(`teamMembers.${index}.name`)} />
                  <Text label='Role' {...register(`teamMembers.${index}.role`)} />
                </div>
                <Button type='button' variant='ghost' size='icon' onClick={() => members.remove(index)}>
                  <Trash2 className='size-4' />
                </Button>
              </div>
              <Controller
                control={control}
                name={`teamMembers.${index}.imagePublicId`}
                render={({ field: f }) => (
                  <CloudinaryUpload
                    mode='single-image'
                    folder='vantage/about'
                    value={f.value || null}
                    onChange={(v) => f.onChange((v as string) ?? null)}
                  />
                )}
              />
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            className='w-fit'
            disabled={members.fields.length >= 12}
            onClick={() => members.append({ name: '', role: '', imagePublicId: null })}
          >
            <Plus className='size-4' /> Add member
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Standards</CardTitle>
          <CardDescription>Icons are fixed by position (first three items). Title may span two lines.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <Text label='Eyebrow' {...register('standardsEyebrow')} />
          <div className='flex flex-col gap-1.5'>
            <Label>Title</Label>
            <Textarea rows={2} {...register('standardsTitle')} />
          </div>
          {image('standardsImagePublicId', 'Image')}
          {standards.fields.map((field, index) => (
            <div key={field.id} className='flex flex-col gap-2 rounded-lg border border-border p-4'>
              <div className='flex items-end gap-2'>
                <div className='flex-1'>
                  <Text label={`Item ${index + 1} title`} {...register(`standardsItems.${index}.title`)} />
                </div>
                <Button type='button' variant='ghost' size='icon' onClick={() => standards.remove(index)}>
                  <Trash2 className='size-4' />
                </Button>
              </div>
              <Textarea {...register(`standardsItems.${index}.description`)} />
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            className='w-fit'
            disabled={standards.fields.length >= 6}
            onClick={() => standards.append({ title: '', description: '' })}
          >
            <Plus className='size-4' /> Add item
          </Button>
        </CardContent>
      </Card>

      {update.isError && <p className='text-sm text-destructive'>{update.error.message}</p>}
      {saved && <p className='text-sm text-emerald-600'>Saved.</p>}
      <div>
        <Button type='submit' disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save about page'}
        </Button>
      </div>
    </form>
  );
}
