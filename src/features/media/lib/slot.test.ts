import { describe, expect, it } from 'vitest';

import { slotPatch, slotRef } from './slot';

describe('image slots', () => {
  it('shows the row media, then its legacy image, then nothing', () => {
    expect(slotRef(undefined, 'm1', 'old')).toEqual({ kind: 'media', id: 'm1' });
    expect(slotRef(undefined, null, 'old')).toEqual({ kind: 'cloudinary', publicId: 'old' });
    expect(slotRef(undefined, null, null)).toBeNull();
  });
  it('a chosen or removed slot wins over the row, and never shows the legacy image again', () => {
    expect(slotRef('m2', 'm1', 'old')).toEqual({ kind: 'media', id: 'm2' });
    expect(slotRef(null, 'm1', 'old')).toBeNull();
  });
  it('only a touched slot is sent', () => {
    expect(slotPatch('iconMediaId', undefined)).toEqual({});
    expect(slotPatch('iconMediaId', null)).toEqual({ iconMediaId: null });
    expect(slotPatch('iconMediaId', 'm2')).toEqual({ iconMediaId: 'm2' });
  });
});
