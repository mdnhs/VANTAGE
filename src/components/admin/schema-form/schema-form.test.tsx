import { renderToStaticMarkup } from 'react-dom/server';
import * as z from 'zod';
import { describe, expect, it, vi } from 'vitest';

import { imageRefSchema } from '@/lib/content/image-ref';

import { ui } from './registry';
import { SchemaForm } from './schema-form';

const Schema = z.object({
  name: z.string().min(1).max(20).register(ui, { label: 'Full name', description: 'As on your ID' }),
  newsletter: z.boolean().default(false).register(ui, { label: 'Newsletter' }),
  tone: z.enum(['warm', 'plain']).register(ui, { label: 'Tone' }),
  mode: z.enum(['a', 'b']).register(ui, { label: 'Mode', widget: 'radio' }),
  bio: z.string().max(400).register(ui, { label: 'Bio', widget: 'textarea' }),
  age: z.number().register(ui, { label: 'Age' }),
  tags: z.array(z.string()).min(1).max(3).register(ui, { label: 'Tags' }),
  address: z.object({ city: z.string().register(ui, { label: 'City' }) }).register(ui, { label: 'Address' }),
  cta: z
    .object({ label: z.string(), href: z.string() })
    .nullable()
    .register(ui, { label: 'Call to action', widget: 'link' }),
  // Registered once in field-ui.ts; do not re-register the shared instance.
  photo: imageRefSchema,
  weekly: z.array(z.object({ day: z.string(), open: z.string(), close: z.string(), closed: z.boolean() })),
});

const defaults = {
  name: 'Magda',
  newsletter: true,
  tone: 'warm' as const,
  mode: 'a' as const,
  bio: 'Hello',
  age: 40,
  tags: ['one', 'two'],
  address: { city: 'Dublin' },
  cta: { label: 'Book', href: '/contact' },
  photo: { kind: 'cloudinary' as const, publicId: 'vantage/site/x' },
  weekly: [
    { day: 'Monday', open: '09:00', close: '17:00', closed: false },
    { day: 'Sunday', open: '09:00', close: '17:00', closed: true },
  ],
};

describe('SchemaForm', () => {
  const html = renderToStaticMarkup(
    <SchemaForm
      schema={Schema}
      defaultValues={defaults}
      submitLabel='Save settings'
      onSubmit={vi.fn()}
      overrides={{ weekly: { widget: 'weekly-hours', label: 'Opening hours' } }}
    />,
  );

  it('renders every widget kind with its label and value', () => {
    for (const text of ['Full name', 'As on your ID', 'Newsletter', 'Tone', 'Bio', 'Age', 'Tags', 'City', 'Photo']) {
      expect(html).toContain(text);
    }
    expect(html).toContain('value="Magda"');
    expect(html).toContain('5/20');
    expect(html).toContain('Save settings');
  });

  it('renders list items, a link pair, radio options and a switch', () => {
    expect(html).toContain('aria-label="Tags 1"');
    expect(html).toContain('Move Tags 1 down');
    expect(html).toContain('Link text');
    expect(html).toContain('value="/contact"');
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('role="switch"');
  });

  it('renders the weekly-hours widget when selected by override', () => {
    expect(html).toContain('Opening hours');
    expect(html).toContain('Monday open time');
    expect(html).toContain('value="09:00"');
    expect(html).toContain('Closed');
  });

  it('shows the image widget upload control', () => {
    expect(html).toContain('Upload');
  });
});
