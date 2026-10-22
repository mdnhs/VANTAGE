import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cacheTag, cacheLife, where } = vi.hoisted(() => ({ cacheTag: vi.fn(), cacheLife: vi.fn(), where: vi.fn() }));
vi.mock('next/cache', () => ({ cacheTag, cacheLife }));
vi.mock('@/server/db', () => ({ db: { select: () => ({ from: () => ({ where }) }) } }));

import { getRedirectTable } from './get-redirect-table';

beforeEach(() => vi.clearAllMocks());

describe('getRedirectTable', () => {
  it('is tagged redirects with the max lifetime and keys rows by source', async () => {
    where.mockResolvedValue([{ source: '/old', destination: '/new', statusCode: 302 }]);
    expect(await getRedirectTable()).toEqual({ '/old': { destination: '/new', statusCode: 302 } });
    expect(cacheTag).toHaveBeenCalledWith('redirects');
    expect(cacheLife).toHaveBeenCalledWith('max');
  });
});
