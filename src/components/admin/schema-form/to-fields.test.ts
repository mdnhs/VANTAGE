import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import { imageRefSchema, videoRefSchema } from '@/lib/content/image-ref';

import { ui } from './registry';
import { emptyValue, emptyValueFor, rebase, toFields } from './to-fields';

const Schema = z
  .object({
    name: z.string().trim().min(1).max(80).register(ui, { label: 'Full name', placeholder: 'Magda Kennedy' }),
    bio: z.string().max(400).optional().register(ui, { label: 'Short bio', widget: 'textarea' }),
    long: z.string().max(500),
    sessions: z.number().int().min(1).max(10).register(ui, { label: 'Sessions' }),
    newsletter: z.boolean().default(true).register(ui, { label: 'Send me the newsletter' }),
    mode: z.enum(['online', 'in-person']).register(ui, {
      label: 'Mode',
      widget: 'radio',
      options: [
        { value: 'online', label: 'Online' },
        { value: 'in-person', label: 'In person' },
      ],
    }),
    tone: z.enum(['warm', 'plain']).register(ui, { label: 'Tone' }),
    tags: z.array(z.string().max(30)).min(1).max(3).register(ui, { label: 'Tags' }),
    address: z.object({ city: z.string().register(ui, { label: 'City' }) }).register(ui, { label: 'Address' }),
    subtitle: z.string().nullable(),
    confirm: z.string(),
  })
  .refine((value) => value.name === value.confirm, { path: ['confirm'], message: 'x' });

describe('toFields', () => {
  const fields = Object.fromEntries(toFields(Schema).map((f) => [f.name, f]));

  it('reads labels and hints from the UI registry', () => {
    expect(fields.name).toMatchObject({
      widget: 'text',
      label: 'Full name',
      placeholder: 'Magda Kennedy',
      required: true,
      maxLength: 80,
    });
  });

  it('infers widgets from the JSON Schema when none is given', () => {
    expect(fields.sessions.widget).toBe('number');
    expect(fields.newsletter).toMatchObject({ widget: 'toggle', required: false });
    expect(fields.tone).toMatchObject({
      widget: 'select',
      options: [
        { value: 'warm', label: 'Warm' },
        { value: 'plain', label: 'Plain' },
      ],
    });
    expect(fields.tags).toMatchObject({ widget: 'list', minItems: 1, maxItems: 3 });
    expect(fields.tags.item?.widget).toBe('text');
    expect(fields.address.widget).toBe('group');
    expect(fields.address.fields?.map((f) => f.name)).toEqual(['address.city']);
    expect(fields.long.widget).toBe('textarea');
  });

  it('unwraps nullable fields', () => {
    expect(fields.subtitle).toMatchObject({ widget: 'text', nullable: true, required: false });
  });

  it('honours an explicit widget and options', () => {
    expect(fields.bio).toMatchObject({ widget: 'textarea', required: false });
    expect(fields.mode.options?.[1]).toEqual({ value: 'in-person', label: 'In person' });
  });

  it('humanises a field with no metadata', () => {
    expect(fields.confirm.label).toBe('Confirm');
  });
});

describe('overrides', () => {
  it('apply by dotted path, with $ for list items', () => {
    const schema = z.object({
      hero: z.object({ title: z.string(), tagline: z.string() }),
      weekly: z.array(z.object({ day: z.string(), open: z.string(), close: z.string(), closed: z.boolean() })),
      links: z.array(z.object({ label: z.string(), href: z.string() })),
    });
    const fields = toFields(schema, {
      'hero.title': { label: 'Headline', widget: 'textarea' },
      weekly: { widget: 'weekly-hours', label: 'Opening hours' },
      'links.$': { widget: 'link' },
      'links.$.label': { label: 'Text' },
    });
    const hero = fields.find((f) => f.name === 'hero')!;
    expect(hero.fields![0]).toMatchObject({ name: 'hero.title', label: 'Headline', widget: 'textarea' });
    expect(hero.fields![1]).toMatchObject({ name: 'hero.tagline', label: 'Tagline', widget: 'text' });
    expect(fields.find((f) => f.name === 'weekly')).toMatchObject({ widget: 'weekly-hours', label: 'Opening hours' });
    expect(fields.find((f) => f.name === 'links')!.item).toMatchObject({ name: 'links.$', widget: 'link' });
  });

  it('names list items with a placeholder that rebase replaces', () => {
    const [list] = toFields(z.object({ stats: z.array(z.object({ value: z.string(), label: z.string() })).min(1) }));
    expect(list!.item!.widget).toBe('group');
    expect(list!.item!.fields!.map((f) => f.name)).toEqual(['stats.$.value', 'stats.$.label']);
    const second = rebase(list!.item!, 'stats.$', 'stats.1');
    expect(second.fields!.map((f) => f.name)).toEqual(['stats.1.value', 'stats.1.label']);
  });
});

describe('image and video refs', () => {
  it('map to image and video widgets, optional', () => {
    const fields = toFields(z.object({ photo: imageRefSchema, clip: videoRefSchema }));
    expect(fields[0]).toMatchObject({ name: 'photo', widget: 'image', required: false });
    expect(fields[1]).toMatchObject({ name: 'clip', widget: 'video', required: false });
  });

  it('survive .register(ui, { label }) on the shared instance', () => {
    // Registering replaces the ui entry; the widget must not be lost.
    try {
      const labelled = imageRefSchema.register(ui, { label: 'Hero' });
      const [field] = toFields(z.object({ hero: labelled }));
      expect(field).toMatchObject({ widget: 'image', label: 'Hero', required: false });
    } finally {
      // restore a plain entry for the remaining tests, even when an assertion fails
      ui.remove(imageRefSchema);
    }
  });

  it('survive .optional() and .default(null)', () => {
    const fields = toFields(
      z.object({
        a: imageRefSchema.optional(),
        b: imageRefSchema.default(null),
        c: videoRefSchema.optional(),
        d: videoRefSchema.default(null),
      }),
    );
    expect(fields.map((f) => f.widget)).toEqual(['image', 'image', 'video', 'video']);
    expect(fields.every((f) => !f.required)).toBe(true);
  });

  it('survive nesting in objects and arrays', () => {
    const [group, list] = toFields(
      z.object({
        card: z.object({ photo: imageRefSchema, title: z.string() }),
        slides: z.array(z.object({ clip: videoRefSchema })),
        gallery: z.array(imageRefSchema),
      }),
    ).filter((f) => f.name !== 'gallery');
    expect(group!.fields![0]).toMatchObject({ name: 'card.photo', widget: 'image' });
    expect(list!.item!.fields![0]).toMatchObject({ name: 'slides.$.clip', widget: 'video' });
    const gallery = toFields(z.object({ gallery: z.array(imageRefSchema) }))[0]!;
    expect(gallery.item).toMatchObject({ name: 'gallery.$', widget: 'image' });
  });

  it('keep an explicit widget override and still start unset', () => {
    const [field] = toFields(z.object({ clip: videoRefSchema }), { clip: { widget: 'image' } });
    expect(field!.widget).toBe('image');
    expect(emptyValue(field!.node)).toBeNull();
  });
});

describe('emptyValueFor', () => {
  it('builds structurally complete starting values', () => {
    const schema = z.object({
      title: z.string(),
      count: z.number().min(2),
      on: z.boolean(),
      kind: z.enum(['a', 'b']),
      tags: z.array(z.string()).min(2),
      sub: z.string().nullable(),
      nested: z.object({ x: z.string() }),
      photo: imageRefSchema,
      clip: videoRefSchema,
      withDefault: z.string().default('hi'),
    });
    expect(emptyValueFor(schema)).toEqual({
      title: '',
      count: 2,
      on: false,
      kind: 'a',
      tags: ['', ''],
      sub: null,
      nested: { x: '' },
      photo: null,
      clip: null,
      withDefault: 'hi',
    });
  });

  it('leaves optional guarded strings unset', () => {
    const value = emptyValueFor(z.object({ href: z.string().min(1).optional() })) as Record<string, unknown>;
    expect(value.href).toBeUndefined();
  });
});
