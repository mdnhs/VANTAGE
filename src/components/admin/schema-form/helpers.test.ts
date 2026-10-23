import { describe, expect, it } from 'vitest';

import { moveItem, parseNumberInput, submitResultErrors } from './helpers';

describe('moveItem', () => {
  it('moves an item without mutating the input', () => {
    const items = ['a', 'b', 'c'];
    expect(moveItem(items, 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(items, 2, 0)).toEqual(['c', 'a', 'b']);
    expect(items).toEqual(['a', 'b', 'c']);
  });

  it('returns an unchanged copy for out-of-range moves', () => {
    const items = ['a', 'b'];
    expect(moveItem(items, 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(items, 1, 2)).toEqual(['a', 'b']);
    expect(moveItem(items, 0, -1)).not.toBe(items);
  });
});

describe('parseNumberInput', () => {
  it('passes real numbers through, including 0 and negatives', () => {
    expect(parseNumberInput(4.5, false)).toBe(4.5);
    expect(parseNumberInput(0, false)).toBe(0);
    expect(parseNumberInput(-2, true)).toBe(-2);
  });

  it('reads partial input as empty: undefined, or null when nullable', () => {
    expect(parseNumberInput(Number.NaN, false)).toBeUndefined();
    expect(parseNumberInput(Number.NaN, undefined)).toBeUndefined();
    expect(parseNumberInput(Number.NaN, true)).toBeNull();
  });
});

describe('submitResultErrors', () => {
  it('maps nothing for a successful (void) result', () => {
    expect(submitResultErrors(undefined)).toEqual({ fields: [], root: undefined });
  });

  it('takes the first message per field and skips empty lists', () => {
    expect(
      submitResultErrors({ fieldErrors: { name: ['Too short', 'Other'], 'address.city': [], email: ['Invalid'] } }),
    ).toEqual({
      fields: [
        { name: 'name', message: 'Too short' },
        { name: 'email', message: 'Invalid' },
      ],
      root: undefined,
    });
  });

  it('returns the form error as root', () => {
    expect(submitResultErrors({ formError: 'Someone else saved this' })).toEqual({
      fields: [],
      root: 'Someone else saved this',
    });
  });
});
