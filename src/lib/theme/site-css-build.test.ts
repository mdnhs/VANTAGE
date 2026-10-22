import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// Opt-in: needs a prior `yarn build`. Run with CHECK_BUILD_CSS=1.
const CSS_DIR = join(process.cwd(), '.next/static/chunks');
const enabled = process.env.CHECK_BUILD_CSS === '1' && existsSync(CSS_DIR);

describe.skipIf(!enabled)('built site CSS', () => {
  const css = enabled
    ? readdirSync(CSS_DIR)
        .filter((name) => name.endsWith('.css'))
        .map((name) => readFileSync(join(CSS_DIR, name), 'utf8'))
        .join('\n')
    : '';

  it('declares the brand defaults and utilities that reference the variables', () => {
    expect(css).toMatch(/--color-brand:\s*#dc2626/);
    expect(css).toMatch(/\.bg-brand\s*\{[^}]*background-color:\s*var\(--color-brand\)/);
    expect(css).toMatch(/\.font-site-heading\s*\{[^}]*font-family:\s*var\(--font-site-heading\)/);
  });

  it('no longer carries the marketing arbitrary brand selectors', () => {
    // Admin-only reds (quote-detail-view text-[#dc2626], bg-[#dc2626]/10) are out of scope (Ruling 12).
    expect(css).not.toMatch(/\.bg-\\\[\\#dc2626\\\]\{/);
    expect(css).not.toMatch(/hover\\:bg-\\\[\\#b91c1c\\\]/);
  });
});
