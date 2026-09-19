'use client';

import { useState, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CloudinaryUpload } from '@/components/form/cloudinary-upload';
import { LottieLogo } from '@/components/ui/lottie-logo';
import { useUpdateBranding } from '../../hooks/api/mutation/use-update-branding';
import { updateBrandingSchema } from '@/validations/site-settings-schema';
import type { SiteSettings, UpdateBrandingInput } from '../../types';
import {
  FileCode,
  Upload,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Link as LinkIcon,
} from 'lucide-react';

type FormValues = UpdateBrandingInput;

function toFormValues(data: SiteSettings | null): FormValues {
  return {
    logoPublicId: data?.logoPublicId ?? '',
    faviconPublicId: data?.faviconPublicId ?? '',
    logoLottieJson: data?.logoLottieJson ?? '',
    logoUseLottie: data?.logoUseLottie ?? false,
  };
}

export function BrandingForm({ initialData }: { initialData: SiteSettings | null }) {
  const { control, handleSubmit, setValue } = useForm<FormValues>({
    resolver: zodResolver(updateBrandingSchema),
    defaultValues: toFormValues(initialData),
  });

  const updateBranding = useUpdateBranding();
  const [saved, setSaved] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewBgDark, setPreviewBgDark] = useState(true);
  const [inputMode, setInputMode] = useState<'upload' | 'url' | 'raw'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lottieData = useWatch({ control, name: 'logoLottieJson' });
  const useLottie = useWatch({ control, name: 'logoUseLottie' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setFileError('Please select a valid .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON format');
        }

        setValue('logoLottieJson', JSON.stringify(parsed), { shouldDirty: true });
        setValue('logoUseLottie', true, { shouldDirty: true });
        setFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        setFileError(null);
      } catch {
        setFileError('Invalid Lottie JSON file. Please ensure it is a valid Lottie / Bodymovin animation.');
      }
    };

    reader.onerror = () => {
      setFileError('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  };

  const clearLottie = () => {
    setValue('logoLottieJson', '', { shouldDirty: true });
    setValue('logoUseLottie', false, { shouldDirty: true });
    setFileName(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    updateBranding.mutate(values, { onSuccess: () => setSaved(true) });
  });

  const hasLottie = Boolean(lottieData?.trim());

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-6'>
      {/* Static Logo & Favicon Card */}
      <Card>
        <CardHeader>
          <CardTitle>Branding assets</CardTitle>
          <CardDescription>Upload your primary static logo image and browser favicon.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Static logo image</FieldLabel>
              <Controller
                control={control}
                name='logoPublicId'
                render={({ field }) => (
                  <CloudinaryUpload
                    mode='single-image'
                    folder='vantage/branding'
                    value={field.value || null}
                    onChange={(v) => field.onChange((v as string) ?? '')}
                  />
                )}
              />
              <p className='text-xs text-muted-foreground'>
                Used on the website and as a fallback if Lottie animation is disabled or loading.
              </p>
            </Field>

            <Field>
              <FieldLabel>Favicon</FieldLabel>
              <Controller
                control={control}
                name='faviconPublicId'
                render={({ field }) => (
                  <CloudinaryUpload
                    mode='single-image'
                    folder='vantage/branding'
                    value={field.value || null}
                    onChange={(v) => field.onChange((v as string) ?? '')}
                  />
                )}
              />
              <p className='text-xs text-muted-foreground'>
                Browser tab icon (recommended: square PNG/SVG or ICO format).
              </p>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Lottie Animated Logo Card */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <div className='flex items-center gap-2'>
                <CardTitle>Lottie animated logo</CardTitle>
                <span className='inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500'>
                  <Sparkles className='size-3' /> Animated
                </span>
              </div>
              <CardDescription className='mt-1'>
                Use a lightweight Lottie JSON animation as your brand logo instead of a static picture.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {/* Enable switch */}
            <Field orientation='horizontal' className='rounded-lg border border-border/60 bg-muted/30 p-3'>
              <Controller
                control={control}
                name='logoUseLottie'
                render={({ field }) => (
                  <Switch
                    id='logoUseLottie'
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={!hasLottie && !field.value}
                  />
                )}
              />
              <div className='flex flex-col gap-0.5'>
                <FieldLabel htmlFor='logoUseLottie' className='cursor-pointer font-medium'>
                  Use Lottie animation as site logo
                </FieldLabel>
                <span className='text-xs text-muted-foreground'>
                  When active, the animated Lottie logo will display in the header, footer, dashboard sidebar, and login
                  page.
                </span>
              </div>
            </Field>

            {/* Input Mode Selector */}
            <div className='flex items-center gap-2 border-b border-border pb-3'>
              <Button
                type='button'
                variant={inputMode === 'upload' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => setInputMode('upload')}
                className='h-8 text-xs'
              >
                <Upload className='mr-1.5 size-3.5' /> Upload .json file
              </Button>
              <Button
                type='button'
                variant={inputMode === 'url' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => setInputMode('url')}
                className='h-8 text-xs'
              >
                <LinkIcon className='mr-1.5 size-3.5' /> Lottie URL
              </Button>
              <Button
                type='button'
                variant={inputMode === 'raw' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => setInputMode('raw')}
                className='h-8 text-xs'
              >
                <FileCode className='mr-1.5 size-3.5' /> Paste JSON
              </Button>
            </div>

            {/* Upload File Mode */}
            {inputMode === 'upload' && (
              <div className='flex flex-col gap-2'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.json,application/json'
                  onChange={handleFileUpload}
                  className='hidden'
                  id='lottie-file-input'
                />
                <label
                  htmlFor='lottie-file-input'
                  className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/80 bg-background/50 p-6 text-center transition-colors hover:border-red-500/50 hover:bg-muted/40'
                >
                  <div className='flex size-10 items-center justify-center rounded-full bg-muted'>
                    <Upload className='size-5 text-muted-foreground' />
                  </div>
                  <div>
                    <span className='text-sm font-medium text-foreground'>Click to upload Lottie JSON</span>
                    <span className='mt-0.5 block text-xs text-muted-foreground'>
                      Supports standard Lottie/Bodymovin .json files
                    </span>
                  </div>
                </label>
                {fileName && (
                  <div className='flex items-center justify-between gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400'>
                    <span className='flex items-center gap-1.5 font-medium'>
                      <CheckCircle2 className='size-4' /> {fileName}
                    </span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={clearLottie}
                      className='h-6 px-2 text-destructive hover:text-destructive'
                    >
                      <Trash2 className='mr-1 size-3' /> Remove
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* URL Mode */}
            {inputMode === 'url' && (
              <Field>
                <FieldLabel>Lottie JSON public URL</FieldLabel>
                <Controller
                  control={control}
                  name='logoLottieJson'
                  render={({ field }) => (
                    <Input
                      placeholder='https://assets.lottiefiles.com/.../animation.json'
                      value={
                        field.value && (field.value.startsWith('http') || field.value.startsWith('/'))
                          ? field.value
                          : ''
                      }
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value) setValue('logoUseLottie', true, { shouldDirty: true });
                      }}
                    />
                  )}
                />
                <p className='text-xs text-muted-foreground'>
                  Direct URL to a hosted Lottie JSON file (e.g., LottieFiles CDN or custom hosting).
                </p>
              </Field>
            )}

            {/* Raw JSON Mode */}
            {inputMode === 'raw' && (
              <Field>
                <FieldLabel>Raw Lottie JSON</FieldLabel>
                <Controller
                  control={control}
                  name='logoLottieJson'
                  render={({ field }) => (
                    <Textarea
                      rows={6}
                      placeholder='Paste {"v":"5.5.7","fr":60,...}'
                      value={field.value ?? ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value) setValue('logoUseLottie', true, { shouldDirty: true });
                      }}
                      className='font-mono text-xs'
                    />
                  )}
                />
                <p className='text-xs text-muted-foreground'>Paste raw Lottie animation JSON code directly.</p>
              </Field>
            )}

            {/* Error Message */}
            {fileError && (
              <div className='flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive'>
                <AlertCircle className='size-4 shrink-0' />
                <span>{fileError}</span>
              </div>
            )}

            {/* Live Preview Box */}
            {hasLottie && (
              <div className='mt-2 flex flex-col gap-2 rounded-lg border border-border p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
                      Live animation preview
                    </span>
                    {useLottie ? (
                      <span className='rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500'>
                        Active on site
                      </span>
                    ) : (
                      <span className='rounded bg-neutral-500/10 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500'>
                        Inactive (switch disabled)
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-xs text-muted-foreground'>Background:</span>
                    <Button
                      type='button'
                      size='icon'
                      variant='outline'
                      className='size-7'
                      onClick={() => setPreviewBgDark(!previewBgDark)}
                      title={previewBgDark ? 'Switch to light preview' : 'Switch to dark preview'}
                    >
                      {previewBgDark ? <Moon className='size-3.5' /> : <Sun className='size-3.5' />}
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={clearLottie}
                      className='h-7 px-2 text-xs text-destructive hover:text-destructive'
                    >
                      <Trash2 className='mr-1 size-3' /> Clear
                    </Button>
                  </div>
                </div>

                <div
                  className={`flex h-36 w-full items-center justify-center rounded-md border border-border/50 p-4 transition-colors ${
                    previewBgDark ? 'bg-[#0d0d0d] text-white' : 'bg-[#f4f4f5] text-black'
                  }`}
                >
                  <LottieLogo
                    data={lottieData}
                    className='h-24 w-auto max-w-[280px]'
                    fallback={<span className='text-xs text-muted-foreground'>Rendering Lottie preview…</span>}
                  />
                </div>
              </div>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {updateBranding.isError && <p className='text-sm text-destructive'>{updateBranding.error.message}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={updateBranding.isPending}>
          {updateBranding.isPending ? 'Saving…' : 'Save branding'}
        </Button>
        {saved && !updateBranding.isPending && <span className='text-sm text-muted-foreground'>Saved.</span>}
      </div>
    </form>
  );
}
