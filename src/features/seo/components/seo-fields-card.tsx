'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MediaField } from '@/features/media/components/media-field';
import { slotPatch, slotRef, type Slot } from '@/features/media/lib/slot';
import { DESCRIPTION_RANGE, TITLE_RANGE } from '@/lib/seo/checks';

import { CharCount } from './char-count';

// The search and sharing fields of a page served from a content row (service, project, legal
// page): the same set as a public page's SEO tab, kept as plain strings while editing.
export type SeoFormState = {
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageMediaId: Slot;
  canonical: string;
  noindex: boolean;
};

type SeoRow = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonical?: string | null;
  noindex?: boolean;
};

export function seoFormState(row: SeoRow | null | undefined): SeoFormState {
  return {
    seoTitle: row?.seoTitle ?? '',
    seoDescription: row?.seoDescription ?? '',
    ogTitle: row?.ogTitle ?? '',
    ogDescription: row?.ogDescription ?? '',
    ogImageMediaId: undefined,
    canonical: row?.canonical ?? '',
    noindex: row?.noindex ?? false,
  };
}

// Blank text is sent as null so the public page falls back; an untouched image is left out.
export function seoPayload(s: SeoFormState) {
  const text = (v: string) => v.trim() || null;
  return {
    seoTitle: text(s.seoTitle),
    seoDescription: text(s.seoDescription),
    ogTitle: text(s.ogTitle),
    ogDescription: text(s.ogDescription),
    ...slotPatch('ogImageMediaId', s.ogImageMediaId),
    canonical: text(s.canonical),
    noindex: s.noindex,
  };
}

interface SeoFieldsCardProps {
  value: SeoFormState;
  onChange: (next: SeoFormState) => void;
  // The page's public address, e.g. /services/crash-repair.
  path: string;
  // The share image the row already has (shown until a new one is picked).
  rowOgImageMediaId?: string | null;
  // What blank fields fall back to, shown as placeholders.
  fallbackTitle?: string;
  imageHint?: string;
  // Server 422 causes keyed by field.
  errors?: Record<string, string[]>;
}

export function SeoFieldsCard({
  value,
  onChange,
  path,
  rowOgImageMediaId,
  fallbackTitle,
  imageHint,
  errors,
}: SeoFieldsCardProps) {
  const set = <K extends keyof SeoFormState>(key: K, v: SeoFormState[K]) => onChange({ ...value, [key]: v });
  const error = (key: string) =>
    errors?.[key]?.length ? <p className='text-sm text-destructive'>{errors[key]!.join(' ')}</p> : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search &amp; sharing</CardTitle>
        <p className='text-sm text-muted-foreground'>
          For the page at <code>{path}</code>. Blank fields fall back to the page&apos;s own name and text.
        </p>
      </CardHeader>
      <CardContent className='grid gap-4 sm:grid-cols-2'>
        <div className='flex flex-col gap-1.5 sm:col-span-2'>
          <Label htmlFor='seoTitle'>SEO title</Label>
          <Input
            id='seoTitle'
            value={value.seoTitle}
            onChange={(e) => set('seoTitle', e.target.value)}
            placeholder={fallbackTitle}
            maxLength={70}
          />
          <CharCount value={value.seoTitle} range={TITLE_RANGE} />
          {error('seoTitle')}
        </div>
        <div className='flex flex-col gap-1.5 sm:col-span-2'>
          <Label htmlFor='seoDescription'>Meta description</Label>
          <Textarea
            id='seoDescription'
            value={value.seoDescription}
            onChange={(e) => set('seoDescription', e.target.value)}
            rows={3}
            maxLength={200}
          />
          <CharCount value={value.seoDescription} range={DESCRIPTION_RANGE} />
          {error('seoDescription')}
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='ogTitle'>Social title</Label>
          <Input
            id='ogTitle'
            value={value.ogTitle}
            onChange={(e) => set('ogTitle', e.target.value)}
            placeholder='Same as the SEO title'
            maxLength={70}
          />
          {error('ogTitle')}
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='ogDescription'>Social description</Label>
          <Textarea
            id='ogDescription'
            value={value.ogDescription}
            onChange={(e) => set('ogDescription', e.target.value)}
            placeholder='Same as the meta description'
            rows={2}
            maxLength={200}
          />
          {error('ogDescription')}
        </div>
        <div className='flex flex-col gap-1.5 sm:col-span-2'>
          <Label>Social share image</Label>
          <MediaField
            kind='image'
            label='Social share image'
            nullable
            value={slotRef(value.ogImageMediaId, rowOgImageMediaId)}
            onChange={(ref) => set('ogImageMediaId', ref?.id ?? null)}
          />
          <p className='text-xs text-muted-foreground'>
            At least 1200×630 (1.91:1). {imageHint ?? 'Blank uses the site default share image.'}
          </p>
          {error('ogImageMediaId')}
        </div>
        <div className='flex flex-col gap-1.5 sm:col-span-2'>
          <Label htmlFor='canonical'>Canonical address</Label>
          <Input
            id='canonical'
            value={value.canonical}
            onChange={(e) => set('canonical', e.target.value)}
            placeholder={path}
            maxLength={300}
          />
          <p className='text-xs text-muted-foreground'>Leave empty to use this page&apos;s own address.</p>
          {error('canonical')}
        </div>
        <div className='flex items-center gap-3 sm:col-span-2'>
          <Switch id='noindex' checked={value.noindex} onCheckedChange={(checked) => set('noindex', checked)} />
          <Label htmlFor='noindex'>Hide from search engines</Label>
        </div>
      </CardContent>
    </Card>
  );
}
