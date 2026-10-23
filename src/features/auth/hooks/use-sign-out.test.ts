import { describe, expect, it, vi } from 'vitest';

import { runSignOut } from './use-sign-out';

const deps = (signOut: () => Promise<{ error?: unknown } | undefined>) => ({
  signOut,
  clearCache: vi.fn(),
  leave: vi.fn(),
});

describe('runSignOut', () => {
  it('clears the cache and leaves once signed out', async () => {
    const d = deps(async () => ({ error: null }));
    expect(await runSignOut(d)).toBe(true);
    expect(d.clearCache).toHaveBeenCalledOnce();
    expect(d.leave).toHaveBeenCalledOnce();
  });

  it('keeps the screen as it was when Better Auth reports an error', async () => {
    const d = deps(async () => ({ error: { message: 'nope' } }));
    expect(await runSignOut(d)).toBe(false);
    expect(d.clearCache).not.toHaveBeenCalled();
    expect(d.leave).not.toHaveBeenCalled();
  });

  it('keeps the screen as it was when the request throws', async () => {
    const d = deps(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await runSignOut(d)).toBe(false);
    expect(d.leave).not.toHaveBeenCalled();
  });
});
