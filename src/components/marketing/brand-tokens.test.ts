import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SITE_FONTS } from '@/lib/theme/fonts';
import { SITE_TOKENS } from '@/lib/theme/tokens';

const ROOTS = ['src/components/marketing', 'src/app/(marketing)'];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const FILES = ROOTS.flatMap((root) => sources(join(process.cwd(), root)));

const HARD_CODED = [
  /#(dc2626|b91c1c|fca5a5|f0605f|ffd9d9)\b/i,
  /rgba\(\s*220\s*,\s*38\s*,\s*38/,
  /var\(--font-(inter|manrope)\)/,
];

describe('marketing brand tokens', () => {
  it('finds the marketing sources', () => {
    expect(FILES.length).toBeGreaterThan(20);
  });

  it.each(HARD_CODED.map((pattern) => [String(pattern), pattern] as const))(
    'no marketing source matches %s',
    (_name, pattern) => {
      const offenders = FILES.filter((file) => pattern.test(readFileSync(file, 'utf8')));
      expect(offenders).toEqual([]);
    },
  );

  it('every brand utility used is one the theme declares (no typos)', () => {
    const declared = new Set<string>(SITE_TOKENS);
    const used = new Set<string>();
    for (const file of FILES) {
      for (const match of readFileSync(file, 'utf8').matchAll(
        /(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|ring|outline|fill|stroke|from|via|to|shadow|decoration|caret|accent)-(brand(?:-[a-z]+)?)(?![\w-])/g,
      )) {
        used.add(match[1]!);
      }
    }
    expect(used.size).toBeGreaterThan(0);
    for (const token of used) expect(declared.has(token), `unknown brand utility: ${token}`).toBe(true);
  });

  it('every site font utility used is heading or body', () => {
    const used = new Set<string>();
    for (const file of FILES) {
      for (const match of readFileSync(file, 'utf8').matchAll(/(?<![\w-])font-site-([a-z]+)/g)) used.add(match[1]!);
    }
    expect([...used].sort()).toEqual(['body', 'heading']);
    expect(Object.keys(SITE_FONTS).length).toBeGreaterThan(0);
  });
});
