import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { SchemaForm } from '@/components/admin/schema-form/schema-form';
import { toFields, type FormField } from '@/components/admin/schema-form/to-fields';
import { EDITABLE_GLOBAL_KEYS, SETTINGS_PAGES, SETTINGS_PAGE_LABELS } from '@/lib/content/global-access';
import { GLOBALS, parseGlobal } from '@/lib/content/globals';

import { GLOBAL_FIELD_UI } from './global-ui';

const paths = (fields: FormField[]): string[] =>
  fields.flatMap((f) => [f.name, ...paths(f.fields ?? []), ...(f.item ? paths([f.item]) : [])]);

describe('GLOBAL_FIELD_UI', () => {
  it.each(Object.keys(GLOBAL_FIELD_UI) as (keyof typeof GLOBAL_FIELD_UI)[])(
    '%s: every override names a real field path',
    (key) => {
      const known = new Set(paths(toFields(GLOBALS[key])));
      for (const path of Object.keys(GLOBAL_FIELD_UI[key]!)) {
        expect(known.has(path), `${key}: ${path}`).toBe(true);
      }
    },
  );

  it('labels the image fields through overrides, not the shared schemas', () => {
    const fields = Object.fromEntries(toFields(GLOBALS.site, GLOBAL_FIELD_UI.site).map((f) => [f.name, f]));
    expect(fields.logo).toMatchObject({ widget: 'image', label: 'Logo' });
    expect(fields.favicon).toMatchObject({ widget: 'image', label: 'Favicon' });
  });
});

describe('settings pages', () => {
  it('every page has a label and only editable keys', () => {
    for (const [slug, keys] of Object.entries(SETTINGS_PAGES)) {
      expect(SETTINGS_PAGE_LABELS[slug as keyof typeof SETTINGS_PAGE_LABELS], slug).toBeTruthy();
      for (const key of keys) expect(EDITABLE_GLOBAL_KEYS).toContain(key);
    }
  });

  it('Forms & microcopy edits the three form documents, one tab each', () => {
    expect(SETTINGS_PAGES.forms).toEqual(['quoteForm', 'contactForm', 'microcopy']);
  });

  it.each(Object.values(SETTINGS_PAGES).flat())('%s renders a form from its defaults with a Save button', (key) => {
    const html = renderToStaticMarkup(
      createElement(SchemaForm, {
        schema: GLOBALS[key],
        overrides: GLOBAL_FIELD_UI[key],
        defaultValues: parseGlobal(key, {}) as never,
        submitLabel: `Save ${key}`,
        onSubmit: () => {},
      }),
    );
    expect(html).toContain(`Save ${key}`);
  });

  it('read-only hides the Save button', () => {
    const html = renderToStaticMarkup(
      createElement(SchemaForm, {
        schema: GLOBALS.privacy,
        defaultValues: parseGlobal('privacy', {}),
        submitLabel: 'Save privacy',
        readOnly: true,
        onSubmit: () => {},
      }),
    );
    expect(html).not.toContain('Save privacy');
    expect(html).toContain('<form');
  });
});
