import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  photo: { kind: 'media' as const, id: '5c1b0f1e-3b49-4f5e-8a53-1a0c2b9d7e11' },
  weekly: [
    { day: 'Monday', open: '09:00', close: '17:00', closed: false },
    { day: 'Sunday', open: '09:00', close: '17:00', closed: true },
  ],
};

const overrides = {
  weekly: { widget: 'weekly-hours' as const, label: 'Opening hours' },
  photo: { label: 'Hero' },
};

// The media widgets read the library through react-query.
const withClient = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
);

const render = (extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    withClient(
      <SchemaForm
        schema={Schema}
        defaultValues={{ ...defaults, ...extra }}
        submitLabel='Save settings'
        onSubmit={vi.fn()}
        overrides={overrides}
      />,
    ),
  );

// The element carrying `id` and its text content.
const labelFor = (html: string, id: string) =>
  new RegExp(`id="${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]*)<`).exec(html)?.[1];

describe('SchemaForm', () => {
  it('renders every widget kind with its label and value', () => {
    const html = render();
    for (const text of ['Full name', 'As on your ID', 'Newsletter', 'Tone', 'Bio', 'Age', 'Tags', 'City']) {
      expect(html).toContain(text);
    }
    expect(html).toContain('value="Magda"');
    expect(html).toContain('5/20');
    expect(html).toContain('>Save settings</button>');
  });

  it('renders list items, a link pair, radio options and a switch', () => {
    const html = render();
    expect(html).toContain('aria-label="Tags 1"');
    expect(html).toContain('aria-label="Move Tags 1 down"');
    expect(html).toContain('aria-label="Remove Tags 2"');
    expect(html).toContain('Link text');
    expect(html).toContain('value="/contact"');
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('role="switch"');
  });

  it('renders the weekly-hours widget as a named group when selected by override', () => {
    const html = render();
    const group = /role="group"[^>]*aria-labelledby="([^"]+)"/g;
    const ids = [...html.matchAll(group)].map((m) => m[1]!);
    expect(ids.map((id) => labelFor(html, id))).toContain('Opening hours');
    expect(html).toContain('aria-label="Monday open time"');
    expect(html).toContain('aria-label="Monday close time"');
    expect(html).toContain('value="09:00"');
    // Sunday is closed: label and no time inputs for it.
    expect(html).toContain('Closed</span>');
    expect(html).not.toContain('aria-label="Sunday open time"');
  });

  it('renders the image widget as a group named by its label, with named buttons', () => {
    const html = render();
    const ids = [...html.matchAll(/role="group"[^>]*aria-labelledby="([^"]+)"/g)].map((m) => m[1]!);
    expect(ids.map((id) => labelFor(html, id))).toContain('Hero');
    expect(html).toContain('aria-label="Change Hero image"');
    expect(html).toContain('>Change image</button>');
    expect(html).toContain('aria-label="Remove Hero image"');
    expect(html).not.toContain('Photo');
  });

  it('describes the image group by its description', () => {
    const html = renderToStaticMarkup(
      withClient(
        <SchemaForm
          schema={Schema}
          defaultValues={defaults}
          submitLabel='Save'
          onSubmit={vi.fn()}
          overrides={{ photo: { label: 'Hero', description: 'Shown at the top' } }}
        />,
      ),
    );
    const describedby = /aria-labelledby="([^"]+)" aria-describedby="([^"]+)"/.exec(html);
    expect(describedby).not.toBeNull();
    expect(labelFor(html, describedby![2]!)).toBe('Shown at the top');
  });
});
