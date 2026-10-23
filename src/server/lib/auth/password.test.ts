import bcrypt from 'bcryptjs';
import { hashPassword } from 'better-auth/crypto';
import { describe, expect, it } from 'vitest';

import { verifyPassword } from './password';

describe('verifyPassword', () => {
  it('verifies legacy bcrypt hashes', async () => {
    const hash = bcrypt.hashSync('Correct-horse-1', 4);
    expect(await verifyPassword({ hash, password: 'Correct-horse-1' })).toBe(true);
    expect(await verifyPassword({ hash, password: 'nope' })).toBe(false);
  });

  it('verifies Better Auth default hashes', async () => {
    const hash = await hashPassword('Correct-horse-1');
    expect(await verifyPassword({ hash, password: 'Correct-horse-1' })).toBe(true);
    expect(await verifyPassword({ hash, password: 'nope' })).toBe(false);
  });
});
