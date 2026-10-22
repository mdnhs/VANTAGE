import { describe, expect, it } from 'vitest';

import { describeError, redact } from './redact';

describe('describeError', () => {
  it('prints the pg error, never the bcrypt hash in query params', () => {
    const hash = '$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
    const pgError = Object.assign(new Error('duplicate key value violates unique constraint'), {
      code: '23505',
      detail: 'Key (email)=(a@b.test) already exists.',
    });
    const error = Object.assign(new Error(`Failed query: insert into accounts params: x,${hash}`), {
      name: 'DrizzleQueryError',
      query: 'insert into accounts',
      params: [hash],
      cause: pgError,
    });
    const out = describeError(error);
    expect(out).not.toContain('$2');
    expect(out).not.toContain(hash);
    expect(out).toContain('23505');
  });

  it('redacts hashes and long tokens from plain errors', () => {
    expect(redact('bad $2a$10$abc123def456 end')).not.toContain('$2a');
    expect(redact(`t ${'A'.repeat(48)}`)).toContain('[redacted]');
  });
});
