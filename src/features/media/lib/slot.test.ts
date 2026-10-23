import { describe, expect, it } from 'vitest';

import { slotPatch, slotRef } from './slot';

describe('image slots', () => {
  it('shows the row media, then nothing', () => {
    expect(slotRef(undefined, 'm1')).toEqual({ kind: 'media', id: 'm1' });
    expect(slotRef(undefined, null)).toBeNull();
  });
  it('a chosen or removed slot wins over the row', () => {
    expect(slotRef('m2', 'm1')).toEqual({ kind: 'media', id: 'm2' });
    expect(slotRef(null, 'm1')).toBeNull();
  });
  it('only a touched slot is sent', () => {
    expect(slotPatch('iconMediaId', undefined)).toEqual({});
    expect(slotPatch('iconMediaId', null)).toEqual({ iconMediaId: null });
    expect(slotPatch('iconMediaId', 'm2')).toEqual({ iconMediaId: 'm2' });
  });
});
