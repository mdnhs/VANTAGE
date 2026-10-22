import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const SRC = path.resolve(__dirname, '..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const files = walk(SRC)
  .filter((f) => f !== __filename)
  .map((f) => ({ file: path.relative(SRC, f), text: readFileSync(f, 'utf8') }));

describe('Cloudinary is gone from the app', () => {
  it('nothing imports the SDK, next-cloudinary or the old helpers', () => {
    const bad = files.filter(({ text }) =>
      /(from|import)\s*\(?\s*['"](cloudinary|next-cloudinary|@\/lib\/cloudinary)(\/[^'"]*)?['"]/.test(text),
    );
    expect(bad.map((f) => f.file)).toEqual([]);
  });

  it('res.cloudinary.com appears only in the legacy URL builder, the migration and the cleanup', () => {
    const allowed = new Set([
      'server/lib/media/legacy-cloudinary.ts',
      'server/lib/media/cloudinary-migration.ts',
      'server/lib/media/cloudinary-cleanup.ts',
    ]);
    const hits = files
      .filter(
        ({ file, text }) =>
          text.includes('res.cloudinary.com') && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'),
      )
      .map((f) => f.file)
      .filter((file) => !allowed.has(file));
    expect(hits).toEqual([]);
  });

  it('no client file reads the Cloudinary cloud name', () => {
    const bad = files.filter(
      ({ text }) =>
        /^\s*['"]use client['"]/m.test(text.split('\n').slice(0, 3).join('\n')) &&
        text.includes('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'),
    );
    expect(bad.map((f) => f.file)).toEqual([]);
  });
});
