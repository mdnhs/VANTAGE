import { describe, expect, it } from 'vitest';

import { collectMediaIds, mapRefs } from './image-ref';

const A = '0b1c1c52-0000-4000-8000-000000000001';
const B = '0b1c1c52-0000-4000-8000-000000000002';

const doc = {
  logo: { kind: 'media', id: A },
  name: 'x',
  hero: { video: { kind: 'cloudinary', publicId: 'v' }, fallbackImage: null },
  team: [{ image: { kind: 'media', id: B } }, { image: { kind: 'media', id: A } }, { image: null }],
};

describe('collectMediaIds', () => {
  it('finds media ids deeply, deduped, ignoring cloudinary and null', () => {
    expect(collectMediaIds(doc)).toEqual([A, B]);
  });
  it('handles scalars', () => {
    expect(collectMediaIds(null)).toEqual([]);
    expect(collectMediaIds('x')).toEqual([]);
  });
});

describe('mapRefs', () => {
  it('replaces refs and reports the key path', () => {
    const seen: string[][] = [];
    const out = mapRefs(doc, (ref, path) => {
      seen.push(path);
      return ref.kind === 'cloudinary' ? { kind: 'media', id: B } : ref;
    }) as typeof doc;
    expect(out.hero.video).toEqual({ kind: 'media', id: B });
    expect(out.logo).toEqual(doc.logo);
    expect(out.name).toBe('x');
    expect(seen).toContainEqual(['hero', 'video']);
    expect(seen).toContainEqual(['team', '1', 'image']);
  });
  it('does not mutate the input', () => {
    mapRefs(doc, () => null);
    expect(doc.logo).toEqual({ kind: 'media', id: A });
  });
});
