import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_FONTS, SITE_FONT_IDS, SITE_FONTS } from './fonts';

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');
const FONT_TS = read('src/lib/font.ts');

// The `Font({ ... })` call that declares this CSS variable.
function declaration(variable: string): string | null {
  const at = FONT_TS.indexOf(`variable: '${variable}'`);
  if (at < 0) return null;
  return FONT_TS.slice(FONT_TS.lastIndexOf('(', at), FONT_TS.indexOf('});', at));
}

describe('font registry', () => {
  it.each(SITE_FONT_IDS)('%s is declared in src/lib/font.ts with its catalogue variable', (id) => {
    expect(declaration(SITE_FONTS[id].variable)).not.toBeNull();
  });

  it.each(SITE_FONT_IDS.filter((id) => id !== DEFAULT_FONTS.heading && id !== DEFAULT_FONTS.body))(
    '%s is not preloaded',
    (id) => {
      expect(declaration(SITE_FONTS[id].variable)).toContain('preload: false');
    },
  );

  it('never disables the metric-matched fallback', () => {
    expect(FONT_TS).not.toContain('adjustFontFallback: false');
  });

  it('the root layout puts every catalogue font variable on <html>', () => {
    expect(read('src/app/layout.tsx')).toMatch(/className=\{`\$\{SITE_FONT_VARIABLES\}/);
    expect(FONT_TS).toContain('export const SITE_FONT_VARIABLES');
  });
});
