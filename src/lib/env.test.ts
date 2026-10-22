import { describe, expect, it } from 'vitest';

import { parseServerEnv } from './env';

const base = {
  DATABASE_URL: 'postgresql://vantage:vantage@localhost:5433/vantage_test',
  AUTH_SECRET: 'test-secret-0123456789-abcdefghij-klmnop',
};

describe('parseServerEnv', () => {
  it('applies local media defaults for a minimal env', () => {
    const env = parseServerEnv(base);
    expect(env.MEDIA_DRIVER).toBe('local');
    expect(env.MEDIA_LOCAL_DIR).toBe('.uploads');
    expect(env.MEDIA_KEY_PREFIX).toBe('vantage');
  });

  it('requires S3 settings when MEDIA_DRIVER=s3', () => {
    expect(() => parseServerEnv({ ...base, MEDIA_DRIVER: 's3' })).toThrow(/S3_BUCKET/);
  });

  it('requires an https MEDIA_PUBLIC_URL when MEDIA_DRIVER=s3', () => {
    expect(() =>
      parseServerEnv({
        ...base,
        MEDIA_DRIVER: 's3',
        S3_BUCKET: 'b',
        S3_ACCESS_KEY_ID: 'k',
        S3_SECRET_ACCESS_KEY: 's',
        MEDIA_PUBLIC_URL: 'http://x',
      }),
    ).toThrow(/MEDIA_PUBLIC_URL must be https/);
  });

  it('rejects an unsafe MEDIA_KEY_PREFIX', () => {
    expect(() => parseServerEnv({ ...base, MEDIA_KEY_PREFIX: '../x' })).toThrow();
  });

  it('coerces port and booleans', () => {
    const env = parseServerEnv({
      ...base,
      SMTP_PORT: '587',
      SMTP_SECURE: 'true',
      AI_PROVIDER_MOCK: 'false',
    });
    expect(env.SMTP_PORT).toBe(587);
    expect(env.SMTP_SECURE).toBe(true);
    expect(env.AI_PROVIDER_MOCK).toBe(false);
  });
});
