import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AI_KEY_PURPOSE,
  CAPI_TOKEN_PURPOSE,
  decryptSecret,
  encryptSecret,
  SecretKeyInvalidError,
  SecretKeyMissingError,
  secretsAvailable,
  SMTP_PASS_PURPOSE,
} from '@/server/lib/secrets';

const KEY_A = Buffer.alloc(32, 1).toString('base64');
const KEY_B = Buffer.alloc(32, 2).toString('base64');

// Empty string counts as unset in parseServerEnv.
const useKey = (key: string) => vi.stubEnv('APP_ENCRYPTION_KEY', key);
afterEach(() => vi.unstubAllEnvs());

describe('secrets (AES-256-GCM, purpose as AAD)', () => {
  it('exposes the purpose constants', () => {
    expect(CAPI_TOKEN_PURPOSE).toBe('tracking.capiToken');
    expect(AI_KEY_PURPOSE).toBe('ai.apiKey');
    expect(SMTP_PASS_PURPOSE).toBe('smtp.pass');
  });
  it('round-trips and never contains the plaintext', () => {
    useKey(KEY_A);
    const sealed = encryptSecret('EAAB-secret-token', CAPI_TOKEN_PURPOSE);
    expect(sealed).toMatch(/^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(sealed).not.toContain('secret');
    expect(decryptSecret(sealed, CAPI_TOKEN_PURPOSE)).toBe('EAAB-secret-token');
  });
  it('uses a fresh IV every time', () => {
    useKey(KEY_A);
    expect(encryptSecret('x', 'p')).not.toBe(encryptSecret('x', 'p'));
  });
  it('returns null for a wrong key or tampering', () => {
    useKey(KEY_A);
    const sealed = encryptSecret('token', CAPI_TOKEN_PURPOSE);
    const parts = sealed.split('.');
    parts[3] = parts[3]!.slice(0, -2) + (parts[3]!.endsWith('A') ? 'BB' : 'AA');
    expect(decryptSecret(parts.join('.'), CAPI_TOKEN_PURPOSE)).toBeNull();
    expect(decryptSecret('garbage', CAPI_TOKEN_PURPOSE)).toBeNull();
    useKey(KEY_B);
    expect(decryptSecret(sealed, CAPI_TOKEN_PURPOSE)).toBeNull();
  });
  it('decryptSecret with wrong purpose returns null', () => {
    useKey(KEY_A);
    const sealed = encryptSecret('token', AI_KEY_PURPOSE);
    expect(decryptSecret(sealed, SMTP_PASS_PURPOSE)).toBeNull();
    expect(decryptSecret(sealed, AI_KEY_PURPOSE)).toBe('token');
  });
  it('encryptSecret throws SecretKeyMissingError when APP_ENCRYPTION_KEY unset', () => {
    useKey('');
    expect(secretsAvailable()).toBe(false);
    expect(() => encryptSecret('x', 'p')).toThrow(SecretKeyMissingError);
    expect(decryptSecret('v1.a.b.c', 'p')).toBeNull();
  });
  it('rejects a payload whose auth tag is truncated', () => {
    useKey(KEY_A);
    const parts = encryptSecret('token', 'p').split('.');
    parts[2] = Buffer.from(parts[2]!, 'base64url').subarray(0, 4).toString('base64url');
    expect(decryptSecret(parts.join('.'), 'p')).toBeNull();
  });
  it('round-trips an empty string', () => {
    useKey(KEY_A);
    expect(decryptSecret(encryptSecret('', 'p'), 'p')).toBe('');
  });
  it('reports availability when the key is set', () => {
    useKey(KEY_A);
    expect(secretsAvailable()).toBe(true);
  });
  it('throws a clear error when the key is not exactly 32 bytes', () => {
    useKey(Buffer.alloc(16, 1).toString('base64'));
    expect(() => encryptSecret('x', 'p')).toThrow(SecretKeyInvalidError);
    expect(() => encryptSecret('x', 'p')).toThrow('APP_ENCRYPTION_KEY must decode to exactly 32 bytes');
    expect(() => decryptSecret('v1.a.b.c', 'p')).toThrow(SecretKeyInvalidError);
  });
});
