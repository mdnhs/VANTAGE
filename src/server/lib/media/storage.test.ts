import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildMediaKey,
  contentDisposition,
  getStorage,
  localFile,
  mediaKeyPattern,
  resetStorageForTests,
  s3Config,
  variantKey,
} from './storage';

const KEY = 'vantage/media/2026/10/0123456789abcdef-photo.jpg';

afterEach(async () => {
  vi.unstubAllEnvs();
  resetStorageForTests();
  await rm(path.resolve('.test-uploads'), { recursive: true, force: true });
});

describe('media storage', () => {
  it('targets the R2 EU endpoint and only checksums when required', () => {
    const config = s3Config({ S3_ACCOUNT_ID: 'acct', S3_ACCESS_KEY_ID: 'k', S3_SECRET_ACCESS_KEY: 's' });
    expect(config).toMatchObject({
      endpoint: 'https://acct.eu.r2.cloudflarestorage.com',
      region: 'auto',
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      forcePathStyle: false,
    });
  });

  it('uses an explicit endpoint (S3 or a local emulator) with path-style URLs', () => {
    expect(
      s3Config({ S3_ENDPOINT: 'http://localhost:9000', S3_ACCESS_KEY_ID: 'k', S3_SECRET_ACCESS_KEY: 's' }),
    ).toMatchObject({ endpoint: 'http://localhost:9000', forcePathStyle: true });
  });

  it.each([
    '../etc/passwd',
    'vantage/media/2026/10/../../x.jpg',
    'vantage/media/2026/10/abc.svg',
    '/etc/passwd',
    'media/2026/10/0123456789abcdef-photo.jpg',
  ])('never resolves %s', (key) => expect(localFile(key, '/srv/storage')).toBeNull());

  it('resolves a well-formed key inside the directory', () => {
    expect(localFile(KEY, '/srv/storage')).toEqual({
      path: `/srv/storage/${KEY}`,
      mimeType: 'image/jpeg',
    });
  });

  it('resolves video keys with their mime type', () => {
    expect(localFile('vantage/media/2026/10/0123456789abcdef-clip.webm', '/srv')?.mimeType).toBe('video/webm');
    expect(localFile('vantage/media/2026/10/0123456789abcdef-clip.mp4', '/srv')?.mimeType).toBe('video/mp4');
  });
});

describe('media keys', () => {
  it('builds keys matching the prefix pattern', () => {
    const key = buildMediaKey('vantage', new Date(Date.UTC(2026, 9, 3)), '0123456789abcdef', 'photo', 'jpg');
    expect(key).toBe(KEY);
    expect(mediaKeyPattern('vantage').test(key)).toBe(true);
    expect(mediaKeyPattern('other').test(key)).toBe(false);
  });

  it('downloads PDFs under their slug and leaves images inline', () => {
    expect(contentDisposition('vantage/media/2026/10/0123456789abcdef-brochure.pdf')).toBe(
      'attachment; filename="brochure.pdf"',
    );
    expect(contentDisposition(KEY)).toBeUndefined();
  });

  it('makes a distinct, still well-formed key for the same bytes', () => {
    const key = `vantage/media/2026/10/0123456789abcdef-${'a'.repeat(60)}.png`;
    const variant = variantKey(key);
    expect(variant).not.toBe(key);
    expect(variant.startsWith('vantage/media/2026/10/0123456789abcdef-')).toBe(true);
    expect(mediaKeyPattern('vantage').test(variant)).toBe(true);
  });
});

describe('local driver', () => {
  it('writes under MEDIA_LOCAL_DIR and serves from /uploads', async () => {
    const storage = getStorage();
    expect(storage.name).toBe('local');
    await storage.put(KEY, Buffer.from('abc'), 'image/jpeg');
    expect((await readFile(path.resolve('.test-uploads', KEY))).toString()).toBe('abc');
    expect(storage.urlFor(KEY)).toBe(`/uploads/${KEY}`);
  });

  it('put rejects key outside prefix', async () => {
    const storage = getStorage();
    await expect(storage.put('media/2026/01/0123456789abcdef-a.jpg', Buffer.from('x'), 'image/jpeg')).rejects.toThrow();
    await expect(
      storage.put('other/media/2026/01/0123456789abcdef-a.jpg', Buffer.from('x'), 'image/jpeg'),
    ).rejects.toThrow();
  });
});

describe('s3 put', () => {
  it('sets cache and disposition headers per kind', async () => {
    const inputs: Record<string, unknown>[] = [];
    vi.doMock('@aws-sdk/client-s3', () => ({
      S3Client: class {
        send = vi.fn(async (command: { input: Record<string, unknown> }) => void inputs.push(command.input));
      },
      PutObjectCommand: class {
        constructor(public input: Record<string, unknown>) {}
      },
    }));
    vi.stubEnv('MEDIA_DRIVER', 's3');
    vi.stubEnv('MEDIA_PUBLIC_URL', 'https://cdn.example.com');
    vi.stubEnv('S3_ACCOUNT_ID', 'acct');
    vi.stubEnv('S3_BUCKET', 'b');
    vi.stubEnv('S3_ACCESS_KEY_ID', 'k');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', 's');
    resetStorageForTests();
    const storage = getStorage();
    await storage.put(KEY, Buffer.from('x'), 'image/jpeg');
    await storage.put('vantage/media/2026/10/0123456789abcdef-brochure.pdf', Buffer.from('x'), 'application/pdf');
    vi.doUnmock('@aws-sdk/client-s3');
    expect(inputs[0]).toMatchObject({
      Bucket: 'b',
      Key: KEY,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    });
    expect(inputs[0]?.ContentDisposition).toBeUndefined();
    expect(inputs[1]).toMatchObject({
      ContentType: 'application/pdf',
      ContentDisposition: 'attachment; filename="brochure.pdf"',
      CacheControl: 'public, max-age=31536000, immutable',
    });
  });
});

describe('s3 driver', () => {
  it('builds public urls from MEDIA_PUBLIC_URL and rejects keys outside the prefix', async () => {
    vi.stubEnv('MEDIA_DRIVER', 's3');
    vi.stubEnv('MEDIA_PUBLIC_URL', 'https://cdn.example.com/');
    vi.stubEnv('S3_ACCOUNT_ID', 'acct');
    vi.stubEnv('S3_BUCKET', 'b');
    vi.stubEnv('S3_ACCESS_KEY_ID', 'k');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', 's');
    resetStorageForTests();
    const storage = getStorage();
    expect(storage.name).toBe('s3');
    expect(storage.urlFor(KEY)).toBe(`https://cdn.example.com/${KEY}`);
    await expect(storage.put('media/2026/01/0123456789abcdef-a.jpg', Buffer.from('x'), 'image/jpeg')).rejects.toThrow();
    await expect(
      storage.put('other/media/2026/01/0123456789abcdef-a.jpg', Buffer.from('x'), 'image/jpeg'),
    ).rejects.toThrow();
  });
});
