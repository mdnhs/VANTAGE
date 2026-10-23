import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ALLOWED_IMPORTERS = [
  'src/server/db/schema/',
  'src/server/lib/settings/site-settings-migration.ts',
  'src/server/repositories/site-settings-repository.ts',
  'src/server/lib/legacy/legacy-check.ts',
  'src/features/globals/legacy-site-settings-writes.test.ts',
  'src/server/lib/settings/no-legacy-settings.test.ts',
];

function getAllSrcFiles(dir: string, baseDir: string = dir): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const relPath = path.relative(path.resolve('.'), fullPath).replace(/\\/g, '/');
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllSrcFiles(fullPath, baseDir));
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
      files.push(relPath);
    }
  }
  return files;
}

describe('no legacy settings reads outside allowlist', () => {
  it('only allowed files import site-settings-repository or schema/site-settings', () => {
    const srcDir = path.resolve('src');
    const files = getAllSrcFiles(srcDir);
    const pattern = /site-settings-repository|schema\/site-settings/;
    const violations: { file: string; match: string }[] = [];

    for (const file of files) {
      if (ALLOWED_IMPORTERS.some((prefix) => file.startsWith(prefix))) continue;
      const content = readFileSync(file, 'utf8');
      const match = content.match(pattern);
      if (match) {
        violations.push({ file, match: match[0] });
      }
    }

    expect(violations).toEqual([]);
  });

  it('nothing exports withLegacyMeta', () => {
    const srcDir = path.resolve('src');
    const files = getAllSrcFiles(srcDir);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (/\bexport\s+.*withLegacyMeta\b/.test(content)) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });
});
