import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const app = path.resolve(import.meta.dirname, '..');
const pages = [
  ['home', 'page.tsx'],
  ['services', 'services/page.tsx'],
  ['our-work', 'our-work/page.tsx'],
  ['insurance', 'insurance/page.tsx'],
  ['about', 'about/page.tsx'],
  ['process', 'process/page.tsx'],
  ['contact', 'contact/page.tsx'],
  ['get-a-quote', 'get-a-quote/page.tsx'],
] as const;

describe('public SEO wiring', () => {
  it.each(pages)('%s page uses getPageMetadata and PageJsonLd', (id, file) => {
    const src = readFileSync(path.join(app, '(marketing)', file), 'utf8');
    expect(src).toContain('export async function generateMetadata()');
    expect(src).toContain(`getPageMetadata('${id}')`);
    expect(src).toContain(`<PageJsonLd id='${id}' />`);
    expect(src).not.toMatch(/export const metadata\b/);
  });

  it('serves the share card from /og, not a file-based opengraph-image', () => {
    expect(existsSync(path.join(app, 'opengraph-image.tsx'))).toBe(false);
    expect(existsSync(path.join(app, 'og/route.tsx'))).toBe(true);
  });

  it('the root layout renders no JSON-LD', () => {
    expect(readFileSync(path.join(app, 'layout.tsx'), 'utf8')).not.toContain('<JsonLd');
  });
});
