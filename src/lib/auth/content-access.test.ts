import { describe, expect, it } from 'vitest';
import { isAuthorOnly } from './content-access';

describe('isAuthorOnly', () => {
  it('is true for author alone', () => expect(isAuthorOnly(['author'])).toBe(true));
  it('is false when another role grants content.update', () => {
    for (const roles of [['editor'], ['admin'], ['owner'], ['author', 'editor']] as const) {
      expect(isAuthorOnly(roles)).toBe(false);
    }
  });
  it('is true for roles that cannot update content', () => {
    expect(isAuthorOnly(['viewer'])).toBe(true);
    expect(isAuthorOnly(['author', 'viewer'])).toBe(true);
  });
});
