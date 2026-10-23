import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ALLOWLIST_PREFIXES = [
  'src/server/db/schema/',
  'src/server/lib/media/cloudinary-migration.ts',
  'src/server/lib/media/legacy-cloudinary.ts',
  'src/server/lib/media/no-legacy-reads.test.ts',
  'src/server/lib/media/no-cloudinary.test.ts',
  'src/lib/no-cloudinary.test.ts',
  'src/server/lib/settings/',
  'src/server/services/globals-service.ts',
  'src/features/about-page/content.ts',
  'src/server/lib/auth/admin-migration.ts',
  'src/server/lib/legacy/legacy-check.ts',
  'src/validations/',
  'src/lib/content/',
  'src/server/services/ai/flatten.ts',
  'src/server/queries/get-page-seo.ts',
  'src/features/seo/components/seo-aside.test.tsx',
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

describe('no legacy media reads outside allowlist', () => {
  it('no file under src/ outside allowlist matches legacy Cloudinary or PublicId references', () => {
    const srcDir = path.resolve('src');
    const files = getAllSrcFiles(srcDir);
    const pattern = /PublicId\b|publicId|legacyCloudinaryUrl|res\.cloudinary\.com/;
    const violations: { file: string; match: string }[] = [];

    for (const file of files) {
      const isAllowed = ALLOWLIST_PREFIXES.some((prefix) => file.startsWith(prefix));
      if (isAllowed) continue;

      const content = readFileSync(file, 'utf8');
      const match = content.match(pattern);
      if (match) {
        violations.push({ file, match: match[0] });
      }
    }

    expect(violations).toEqual([]);
  });
});
