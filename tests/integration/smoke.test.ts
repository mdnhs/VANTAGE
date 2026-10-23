import { Pool } from 'pg';
import { expect, it } from 'vitest';

import { TEST_DATABASE_URL } from '../test-env.mjs';

it('has applied migrations to the test database', async () => {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  try {
    const { rows } = await pool.query<{ count: string }>('select count(*) from drizzle.__drizzle_migrations');
    expect(Number(rows[0].count)).toBeGreaterThan(0);
  } finally {
    await pool.end();
  }
});
