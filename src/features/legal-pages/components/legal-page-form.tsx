'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageTabs } from '@/components/layout/page-tabs';
import { SeoFieldsCard, seoFormState, seoPayload, type SeoFormState } from '@/features/seo/components/seo-fields-card';
import { APP_ROUTES } from '@/lib/routes/app-routes';
import { slugify, type CreateLegalPageInput } from '@/validations/legal-page-schema';
import { LegalPageEditor } from './legal-page-editor';
import type { LegalPage, TiptapDoc } from '../types';

const EMPTY_DOC: TiptapDoc = { type: 'doc', content: [{ type: 'paragraph' }] };

interface LegalPageFormProps {
  initialData?: LegalPage | null;
  onSubmit: (input: CreateLegalPageInput) => Promise<unknown>;
  isSubmitting: boolean;
  submitError?: string | null;
  // Server 422/409 causes, shown under the field they name.
  submitCauses?: Record<string, string[]>;
  submitLabel: string;
}

// Shared by both the create and edit screens — only the submit handler and initial data
// differ between them.
export function LegalPageForm({
  initialData = null,
  onSubmit,
  isSubmitting,
  submitError,
  submitCauses,
  submitLabel,
}: LegalPageFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initialData));
  const [published, setPublished] = useState(initialData?.status === 'published');
  const [content, setContent] = useState<TiptapDoc>(initialData?.content ?? EMPTY_DOC);
  const [seo, setSeo] = useState<SeoFormState>(() => seoFormState(initialData));

  const renamesLivePage = initialData?.status === 'published' && slug !== initialData.slug;
  const slugError = submitCauses?.slug?.[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, slug, content, status: published ? 'published' : 'draft', ...seoPayload(seo) });
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      <PageTabs
        tabs={[
          {
            value: 'details',
            label: 'Page',
            content: (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Page details</CardTitle>
                  </CardHeader>
                  <CardContent className='grid gap-4 sm:grid-cols-2'>
                    <div className='flex flex-col gap-1.5'>
                      <Label htmlFor='title'>Title</Label>
                      <Input
                        id='title'
                        value={title}
                        maxLength={160}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (!slugTouched) setSlug(slugify(e.target.value));
                        }}
                        placeholder='Privacy Policy'
                        required
                      />
                    </div>
                    <div className='flex flex-col gap-1.5'>
                      <Label htmlFor='slug'>Address</Label>
                      <div className='flex items-center gap-1'>
                        <span className='text-sm text-muted-foreground'>/</span>
                        <Input
                          id='slug'
                          value={slug}
                          maxLength={140}
                          onChange={(e) => {
                            setSlugTouched(true);
                            setSlug(e.target.value);
                          }}
                          pattern='^[a-z0-9]+(-[a-z0-9]+)*$'
                          title='Lowercase letters, numbers and hyphens, e.g. privacy-policy'
                          aria-invalid={Boolean(slugError)}
                          aria-describedby='slug-help'
                          required
                        />
                      </div>
                      <p
                        id='slug-help'
                        className={slugError ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}
                      >
                        {slugError ??
                          (renamesLivePage
                            ? `The old address /${initialData!.slug} will redirect here.`
                            : 'Lowercase letters, numbers and hyphens.')}
                      </p>
                    </div>
                    <div className='flex items-center gap-3 sm:col-span-2'>
                      <Switch id='published' checked={published} onCheckedChange={setPublished} />
                      <Label htmlFor='published'>Published — shown on the site and linked from the footer</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LegalPageEditor initialContent={content} onChange={setContent} />
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
                value={seo}
                onChange={setSeo}
                path={`/${slug || 'slug'}`}
                rowOgImageMediaId={initialData?.ogImageMediaId}
                fallbackTitle={title || undefined}
                errors={submitCauses}
              />
            ),
          },
        ]}
      />

      {submitError && !slugError && <p className='text-sm text-destructive'>{submitError}</p>}

      <div className='flex items-center gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type='button' variant='outline' onClick={() => router.push(APP_ROUTES.content.legalPages.index)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
