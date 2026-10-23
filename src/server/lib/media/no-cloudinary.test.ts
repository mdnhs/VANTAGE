import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('no cloudinary in next config', () => {
  it('next.config.ts does not include res.cloudinary.com in remotePatterns', () => {
    const configPath = path.resolve('next.config.ts');
    const content = readFileSync(configPath, 'utf8');
    expect(content).not.toContain('res.cloudinary.com');
  });
});
