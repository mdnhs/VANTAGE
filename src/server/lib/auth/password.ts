import 'server-only';

import bcrypt from 'bcryptjs';
import { verifyPassword as defaultVerify } from 'better-auth/crypto';

const BCRYPT = /^\$2[aby]\$/;

// Hashes written before the Better Auth move are bcrypt; new ones use Better
// Auth's default scrypt. Hashing is left to the default.
export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  if (BCRYPT.test(hash)) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
  return defaultVerify({ hash, password });
}
