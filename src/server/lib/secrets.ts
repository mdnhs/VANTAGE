import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { serverEnv } from '@/lib/env';

// v1.<iv>.<tag>.<ciphertext>, base64url, AES-256-GCM with a 12-byte IV and the
// purpose as additional authenticated data.
const TAG_BYTES = 16;

export const CAPI_TOKEN_PURPOSE = 'tracking.capiToken';
export const AI_KEY_PURPOSE = 'ai.apiKey';
export const SMTP_PASS_PURPOSE = 'smtp.pass';

export class SecretKeyMissingError extends Error {
  constructor() {
    super('APP_ENCRYPTION_KEY is not set');
    this.name = 'SecretKeyMissingError';
  }
}

export class SecretKeyInvalidError extends Error {
  constructor() {
    super('APP_ENCRYPTION_KEY must decode to exactly 32 bytes (openssl rand -base64 32)');
    this.name = 'SecretKeyInvalidError';
  }
}

export const secretsAvailable = (): boolean => Boolean(serverEnv().APP_ENCRYPTION_KEY);

// Guards AES-256 directly so a wrong-length key never reaches createCipheriv
// with a cryptic error.
function key(): Buffer | null {
  const raw = serverEnv().APP_ENCRYPTION_KEY;
  if (!raw) return null;
  const k = Buffer.from(raw, 'base64');
  if (k.length !== 32) throw new SecretKeyInvalidError();
  return k;
}

export function encryptSecret(plain: string, purpose: string): string {
  const k = key();
  if (!k) throw new SecretKeyMissingError();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', k, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(purpose));
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), body.toString('base64url')].join(
    '.',
  );
}

export function decryptSecret(payload: string, purpose: string): string | null {
  const k = key();
  const [version, ivPart, tagPart, body] = payload.split('.');
  // An empty plaintext seals to an empty body, so only undefined is invalid.
  if (!k || version !== 'v1' || !ivPart || !tagPart || body === undefined) return null;
  const iv = Buffer.from(ivPart, 'base64url');
  const tag = Buffer.from(tagPart, 'base64url');
  // Pin the tag length: GCM otherwise accepts truncated tags.
  if (iv.length !== 12 || tag.length !== TAG_BYTES) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', k, iv, { authTagLength: TAG_BYTES });
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
