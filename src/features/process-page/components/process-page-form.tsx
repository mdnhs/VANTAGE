'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProcessPage } from '@/features/site-settings/hooks/api/mutation/use-update-process-page';

interface FormValues {
  eyebrow: string;
  title: string;
  subtext: string;
}

export function ProcessPageForm({ initialContent }: { initialContent: FormValues }) {
  const { register, handleSubmit } = useForm<FormValues>({ defaultValues: initialContent });
  const update = useUpdateProcessPage();
  const [saved, setSaved] = useState(false);

  const onSubmit = handleSubmit((v) => {
    setSaved(false);
    update.mutate(
      { processPageEyebrow: v.eyebrow, processPageTitle: v.title, processPageSubtext: v.subtext },
      { onSuccess: () => setSaved(true) },
    );
  });

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Page header copy</CardTitle>
          <CardDescription>
            Use {'{count}'} in the title to insert the number of enabled steps (e.g. &ldquo;The {'{count}'}-Step Vantage
            Standard&rdquo;).
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='eyebrow'>Eyebrow</Label>
            <Input id='eyebrow' {...register('eyebrow')} />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='title'>Title</Label>
            <Input id='title' {...register('title')} />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='subtext'>Description</Label>
            <Textarea id='subtext' {...register('subtext')} />
          </div>
          {update.isError && <p className='text-sm text-destructive'>{update.error.message}</p>}
          {saved && <p className='text-sm text-emerald-600'>Saved.</p>}
          <div>
            <Button type='submit' disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save header copy'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
