import { readdirSync } from 'node:fs';
import path from 'node:path';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  HOME_DESCRIPTION,
  LIVE_PATHS,
  PUBLIC_PAGE_IDS,
  PUBLIC_PAGES,
  isReservedPath,
  LEGACY_PAGE_EXTENSION,
  seoFixHref,
  type PublicPageId,
} from './public-pages';

const MARKETING = join(process.cwd(), 'src/app/(marketing)');
const pageSource = (id: PublicPageId) => readFileSync(join(MARKETING, id === 'home' ? '' : id, 'page.tsx'), 'utf8');

// The string literal after `key:` (single, double or backtick quoted, possibly on the next line).
function literal(source: string, key: string): string {
  const match = new RegExp(`${key}:\\s*(?:'((?:[^'\\\\]|\\\\.)*)'|"((?:[^"\\\\]|\\\\.)*)")`).exec(source);
  if (!match) throw new Error(`no ${key} literal`);
  return match[1] ?? match[2]!;
}

describe('public page registry', () => {
  it('lists the eight pages with unique paths and LIVE_PATHS matching', () => {
    expect(PUBLIC_PAGE_IDS).toHaveLength(8);
    const paths = PUBLIC_PAGE_IDS.map((id) => PUBLIC_PAGES[id].path);
    expect(new Set(paths).size).toBe(8);
    expect(LIVE_PATHS.size).toBe(8);
    for (const path of paths) expect(LIVE_PATHS.has(path)).toBe(true);
    expect(LIVE_PATHS.has('/old')).toBe(false);
    for (const id of PUBLIC_PAGE_IDS) expect(PUBLIC_PAGES[id].id).toBe(id);
  });

  it.each(PUBLIC_PAGE_IDS.filter((id) => id !== 'home'))('%s title and description equal its page metadata', (id) => {
    const source = pageSource(id);
    expect(PUBLIC_PAGES[id].title).toBe(literal(source, 'title'));
    expect(PUBLIC_PAGES[id].description).toBe(literal(source, 'description'));
  });

  it('home uses the page description constant and the registry title', () => {
    const source = pageSource('home');
    expect(HOME_DESCRIPTION).toBe(/const DESCRIPTION =\s*'([^']*)'/.exec(source)![1]);
    expect(source).toContain('Precision Crash Repair & Restoration Dublin');
    expect(PUBLIC_PAGES.home.title).toBe('Precision Crash Repair & Restoration Dublin');
  });

  it('counts at least one in-page internal link and one h1 per page', () => {
    for (const id of PUBLIC_PAGE_IDS) {
      expect(PUBLIC_PAGES[id].codeLinks).toBeGreaterThanOrEqual(1);
      expect(PUBLIC_PAGES[id].hasH1).toBe(true);
    }
  });

  it('flags reserved paths', () => {
    for (const p of [
      '/dashboard',
      '/dashboard/x',
      '/api/v1/x',
      '/robots.txt',
      '/assets/a.jpg',
      '/login',
      '/og',
      '/file.svg',
      '/a/b.jpg',
      '/opengraph-image',
      '//dashboard',
      '/twitter-image',
    ]) {
      expect(isReservedPath(p), p).toBe(true);
    }
    for (const p of ['/services', '/old-page', '/apiary', '/og-old', '/', '/about.html', '/Services.PHP', '/index.htm', '/page.asp', '/page.aspx']) {
      expect(isReservedPath(p), p).toBe(false);
    }
  });

  it('links each page to its page.* global, none for contact and get-a-quote', () => {
    for (const id of PUBLIC_PAGE_IDS) {
      expect(PUBLIC_PAGES[id].pageKey).toBe(PUBLIC_PAGES[id].editorTab ? `page.${id}` : null);
    }
  });

  it('builds the Fix link', () => {
    expect(seoFixHref('about')).toBe('/dashboard/about?tab=seo');
    expect(seoFixHref('contact')).toBe('/dashboard/seo/pages/contact');
    expect(seoFixHref('get-a-quote')).toBe('/dashboard/seo/pages/get-a-quote');
  });
});

describe('legacy page extensions', () => {
  it('stay redirectable, unless under an app-owned prefix', () => {
    expect(isReservedPath('/dashboard/x.html')).toBe(true);
    expect(isReservedPath('/api/x.php')).toBe(true);
    expect(isReservedPath('/logo.svg')).toBe(true);
    expect(isReservedPath('/page.html.map')).toBe(true);
  });

  it('public/ holds no legacy page file, so the proxy never shadows a real asset', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : [e.name],
      );
    const legacy = walk(path.join(process.cwd(), 'public')).filter((f) => LEGACY_PAGE_EXTENSION.test(f));
    expect(legacy).toEqual([]);
  });
});
