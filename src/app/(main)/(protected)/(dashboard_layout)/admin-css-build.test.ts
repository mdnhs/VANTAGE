import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../../../..');
const staticDir = path.join(root, '.next/static');

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(path.join(dir, e.name)) : e.name.endsWith('.css') ? [path.join(dir, e.name)] : [],
  );
}

// Needs a prior `yarn build`; skipped otherwise.
describe.skipIf(!existsSync(staticDir))('built admin CSS', () => {
  const files = existsSync(staticDir) ? cssFiles(staticDir) : [];
  const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');

  it('generates the admin utilities and theme colours', () => {
    for (const needle of ['.rounded-card', '.text-title', '.bg-hero', '.bg-hatch', '--color-success']) {
      expect(all, needle).toContain(needle);
    }
  });

  it('keeps admin colour values inside the admin scope', () => {
    for (const f of files) {
      const css = readFileSync(f, 'utf8');
      for (const m of css.matchAll(/([^{}]*)\{[^{}]*--primary:\s*#dc2626[^{}]*\}/g)) {
        expect(m[1], f).toContain('data-admin-root');
      }
    }
  });
});
