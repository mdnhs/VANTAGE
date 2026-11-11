import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const flat = (fields: FormField[]): FormField[] =>
  fields.flatMap((f) => [f, ...flat(f.fields ?? []), ...(f.item ? flat([f.item]) : [])]);

// Dotted paths of every string in a value that contains a line break ("$" for list items).
const multilinePaths = (value: unknown, path = ''): string[] => {
  if (typeof value === 'string') return value.includes('\n') ? [path] : [];
  if (Array.isArray(value)) return value.flatMap((item) => multilinePaths(item, `${path}.$`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => multilinePaths(v, path ? `${path}.${k}` : k));
  }
  return [];
};

describe('multiline copy', () => {
  it('about standards.title is a textarea', () => {
    const field = flat(toFields(GLOBALS['page.about'], GLOBAL_FIELD_UI['page.about'])).find(
      (f) => f.name === 'standards.title',
    );
    expect(field?.widget).toBe('textarea');
  });

  it.each(EDITABLE_GLOBAL_KEYS)('%s: every default containing a line break is edited in a textarea', (key) => {
    const fields = flat(toFields(GLOBALS[key], GLOBAL_FIELD_UI[key]));
    for (const path of multilinePaths(parseGlobal(key, {}))) {
      expect(fields.find((f) => f.name === path)?.widget, `${key}: ${path}`).toBe('textarea');
    }
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
    // The image widgets read the media library through react-query, as in the app.
    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(SchemaForm, {
          schema: GLOBALS[key],
          overrides: GLOBAL_FIELD_UI[key],
          defaultValues: parseGlobal(key, {}) as never,
          submitLabel: `Save ${key}`,
          onSubmit: () => {},
        }),
      ),
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

describe('footer social media form', () => {
  const social = flat(toFields(GLOBALS.footer, GLOBAL_FIELD_UI.footer)).find((f) => f.name === 'socials');

  it('is a list with an add button named after the field', () => {
    expect(social?.widget).toBe('list');
    expect(social?.label).toBe('Social media');
  });

  it('asks for a name, a link and an uploaded icon for each profile', () => {
    const item = flat(social?.item ? [social.item] : []);
    const field = (name: string) => item.find((f) => f.name === `socials.$.${name}`);
    expect(field('name')?.label).toBe('Name');
    expect(field('url')?.inputType).toBe('url');
    // One line, not the tall box long text gets by default.
    expect(field('url')?.widget).toBe('text');
    expect(field('icon')?.widget).toBe('image');
  });
});

describe('footer editor layout', () => {
  const top = toFields(GLOBALS.footer, GLOBAL_FIELD_UI.footer);

  it('lists fields in the order the footer shows them', () => {
    expect(top.map((f) => f.name)).toEqual([
      'blurb',
      'socials',
      'columns',
      'contactNote',
      'copyrightName',
      'legalNote',
      'legalLinks',
    ]);
  });

  it('puts every field in a section: Brand, Social media, Link columns, Contact column, Bottom bar', () => {
    expect(top.map((f) => [f.name, f.section])).toEqual([
      ['blurb', 'Brand'],
      ['socials', 'Social media'],
      ['columns', 'Link columns'],
      ['contactNote', 'Contact column'],
      ['copyrightName', 'Bottom bar'],
      ['legalNote', 'Bottom bar'],
      ['legalLinks', 'Bottom bar'],
    ]);
  });

  it('renders the five section headings in that order', () => {
    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(SchemaForm, {
          schema: GLOBALS.footer,
          defaultValues: parseGlobal('footer', {}),
          onSubmit: () => undefined,
          submitLabel: 'Save',
          overrides: GLOBAL_FIELD_UI.footer,
        }),
      ),
    );
    const at = ['>Brand<', '>Social media<', '>Link columns<', '>Contact column<', '>Bottom bar<'].map((h) =>
      html.indexOf(h),
    );
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
  });

  it('as tabs: five horizontal tabs in site order, every panel still in the form', () => {
    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(SchemaForm, {
          schema: GLOBALS.footer,
          defaultValues: parseGlobal('footer', {}),
          onSubmit: () => undefined,
          submitLabel: 'Save',
          overrides: GLOBAL_FIELD_UI.footer,
          sectionTabs: true,
        }),
      ),
    );
    const tabs = [...html.matchAll(/role="tab"[^>]*>([^<]+)</g)].map((m) => m[1]);
    expect(tabs).toEqual(['Brand', 'Social media', 'Link columns', 'Contact column', 'Bottom bar']);
    expect(html).toContain('Text under the logo');
    expect(html).toContain('Small links');
  });
});

describe('settings pages are organised into tabs', () => {
  const TABS: Record<string, string[]> = {
    site: ['Business', 'Logo & icons', 'Social profiles'],
    contact: ['Phone & email', 'Address & map', 'Opening hours'],
    navigation: ['Menu links', 'Quote button'],
    footer: ['Brand', 'Social media', 'Link columns', 'Contact column', 'Bottom bar'],
    quoteForm: ['Field text', 'Buttons', 'Reassurance', 'After sending'],
    contactForm: ['Heading', 'Fields', 'Buttons & notes', 'After sending'],
    microcopy: ['Contact info', 'Visit us'],
    notifications: ['Recipients', 'Auto-reply'],
    privacy: ['Enquiries', 'Spam'],
    supportBot: ['Assistant', 'Limits'],
  };

  it('covers every document the Settings pages edit', () => {
    expect(Object.keys(TABS).sort()).toEqual([...Object.values(SETTINGS_PAGES).flat()].sort());
  });

  it.each(Object.entries(TABS))('%s: every field is in a section, one unbroken run each', (key, tabs) => {
    const fields = toFields(GLOBALS[key as keyof typeof GLOBALS], GLOBAL_FIELD_UI[key as keyof typeof GLOBAL_FIELD_UI]);
    expect(fields.filter((f) => !f.section).map((f) => f.name)).toEqual([]);
    // A section split in two runs would show as two tabs with the same name.
    const runs = fields.map((f) => f.section).filter((section, i, all) => section !== all[i - 1]);
    expect(runs).toEqual(tabs);
  });
});
