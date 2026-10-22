import { describe, expect, it } from 'vitest';

import { topLevelDiff } from './top-level-diff';

describe('topLevelDiff', () => {
  it('lists only the top-level keys that changed', () => {
    expect(topLevelDiff({ a: 1, b: { x: 1 }, c: 'same' }, { a: 2, b: { x: 2 }, c: 'same' })).toEqual({
      a: { from: 1, to: 2 },
      b: { from: { x: 1 }, to: { x: 2 } },
    });
  });

  it('treats a missing side as null and an absent before as empty', () => {
    expect(topLevelDiff(undefined, { a: 1 })).toEqual({ a: { from: null, to: 1 } });
    expect(topLevelDiff({ a: 1 }, {})).toEqual({ a: { from: 1, to: null } });
  });

  it('ignores object key order (jsonb reorders keys)', () => {
    expect(topLevelDiff({ a: { x: 1, y: [{ p: 1, q: 2 }] } }, { a: { y: [{ q: 2, p: 1 }], x: 1 } })).toEqual({});
  });

  it('returns an empty diff when nothing changed', () => {
    expect(topLevelDiff({ a: [1, 2] }, { a: [1, 2] })).toEqual({});
  });
});
