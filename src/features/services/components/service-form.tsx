'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FieldDescription } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { MediaField } from '@/features/media/components/media-field';
import { slotPatch, slotRef, type Slot } from '@/features/media/lib/slot';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { TiptapDoc } from '@/validations/legal-page-schema';
import { PageTabs } from '@/components/layout/page-tabs';
import { SeoFieldsCard, seoFormState, seoPayload, type SeoFormState } from '@/features/seo/components/seo-fields-card';
import type { Service } from '../types';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hasText(doc: TiptapDoc | null): doc is TiptapDoc {
  const walk = (nodes: TiptapDoc['content']): boolean =>
    nodes.some((n) => Boolean(n.text?.trim()) || n.type === 'horizontalRule' || walk(n.content ?? []));
  return Boolean(doc && walk(doc.content));
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  iconMediaId: Slot;
  imageMediaId: Slot;
  checklist: string;
  content: TiptapDoc | null;
  isEnabled: boolean;
  seo: SeoFormState;
}

function toFormState(data: Service | null): FormState {
  return {
    name: data?.name ?? '',
    slug: data?.slug ?? '',
    description: data?.description ?? '',
    iconMediaId: undefined,
    imageMediaId: undefined,
    checklist: (data?.checklist ?? []).join('\n'),
    content: data?.content ?? null,
    isEnabled: data?.isEnabled ?? true,
    seo: seoFormState(data),
  };
}

interface ServiceFormProps {
  initialData?: Service | null;
  onSubmit: (
    input: {
      name: string;
      slug: string;
      description: string;
      iconMediaId?: string | null;
      imageMediaId?: string | null;
      checklist: string[];
      content: TiptapDoc | null;
      isEnabled: boolean;
    } & ReturnType<typeof seoPayload>,
  ) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  submitLabel: string;
}

// Shared by both the create and edit screens — only the submit handler and initial data
// differ between them.
export function ServiceForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitLabel,
}: ServiceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toFormState(initialData));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData));

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setField('name', value);
    if (!slugTouched) {
      setField('slug', slugify(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: form.name,
      slug: form.slug,
      description: form.description,
      ...slotPatch('iconMediaId', form.iconMediaId),
      ...slotPatch('imageMediaId', form.imageMediaId),
      checklist: form.checklist
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      // An editor cleared to a single empty paragraph saves as "no body".
      content: hasText(form.content) ? form.content : null,
      isEnabled: form.isEnabled,
      ...seoPayload(form.seo),
    });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <PageTabs
        tabs={[
          {
            value: 'details',
            label: 'Details',
            content: (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Service details</CardTitle>
                  </CardHeader>
                  <CardContent className='grid gap-4 sm:grid-cols-2'>
                    <div className='flex flex-col gap-1.5'>
                      <Label htmlFor='name'>Name</Label>
                      <FieldDescription>The service title, on the Services page and its own page.</FieldDescription>
                      <Input id='name' value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                      <Label htmlFor='slug'>Page address</Label>
                      <FieldDescription>
                        The page lives at /services/{form.slug || '…'}. Lowercase words joined by hyphens.
                      </FieldDescription>
                      <Input
                        id='slug'
                        value={form.slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setField('slug', e.target.value);
                        }}
                        pattern='^[a-z0-9]+(-[a-z0-9]+)*$'
                        required
                      />
                    </div>
                    <div className='flex flex-col gap-1.5 sm:col-span-2'>
                      <Label htmlFor='description'>Short description</Label>
                      <FieldDescription>
                        A sentence or two, on the service card and under the title of its own page.
                      </FieldDescription>
                      <Textarea
                        id='description'
                        value={form.description}
                        onChange={(e) => setField('description', e.target.value)}
                        required
                      />
                    </div>
                    <div className='flex flex-col gap-1.5 sm:col-span-2'>
                      <Label htmlFor='checklist'>What&apos;s included</Label>
                      <FieldDescription>One item per line; each gets a green tick.</FieldDescription>
                      <Textarea
                        id='checklist'
                        value={form.checklist}
                        onChange={(e) => setField('checklist', e.target.value)}
                        placeholder={'Structural Realignment\nLaser Chassis Measuring'}
                        rows={5}
                      />
                    </div>
                    <div className='flex items-center gap-3 pt-6'>
                      <Switch
                        id='isEnabled'
                        checked={form.isEnabled}
                        onCheckedChange={(checked) => setField('isEnabled', checked)}
                      />
                      <Label htmlFor='isEnabled'>Show on the website</Label>
                    </div>
                    <div className='flex flex-col gap-1.5 sm:col-span-2'>
                      <Label>Icon</Label>
                      <FieldDescription>Small icon on the service card. Empty uses a built-in icon.</FieldDescription>
                      <MediaField
                        kind='image'
                        label='Icon'
                        nullable
                        value={slotRef(form.iconMediaId, initialData?.iconMediaId)}
                        onChange={(ref) => setField('iconMediaId', ref?.id ?? null)}
                      />
                    </div>
                    <div className='flex flex-col gap-1.5 sm:col-span-2'>
                      <Label>Photo</Label>
                      <FieldDescription>
                        On the service card and its own page. Empty uses a built-in workshop photo.
                      </FieldDescription>
                      <MediaField
                        kind='image'
                        label='Image'
                        nullable
                        value={slotRef(form.imageMediaId, initialData?.imageMediaId)}
                        onChange={(ref) => setField('imageMediaId', ref?.id ?? null)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>More about this service</CardTitle>
                    <CardDescription>
                      Longer text for this service&apos;s own page, shown below the photo. Use headings and lists to
                      break it up. Leave empty if the short description is enough.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      initialContent={form.content}
                      onChange={(doc) => setField('content', doc)}
                      ariaLabel='Detail page content'
                    />
                  </CardContent>
                </Card>
              </>
            ),
          },
          {
            value: 'seo',
            label: 'Search & sharing',
            content: (
              <SeoFieldsCard
                value={form.seo}
                onChange={(seo) => setField('seo', seo)}
                path={`/services/${form.slug || 'slug'}`}
                rowOgImageMediaId={initialData?.ogImageMediaId}
                fallbackTitle={form.name || undefined}
                imageHint='Blank uses the service image.'
              />
            ),
          },
        ]}
      />

      {submitError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.services.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
