import { describe, expect, it } from 'vitest';

import { sizedSrc, type PublicImage } from './public-image';

const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const legacy = (publicId: string): PublicImage => ({
  id: null,
  src: `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/${publicId}`,
  mimeType: null,
  width: null,
  height: null,
  alt: '',
  blurDataUrl: null,
  focal: { x: 0.5, y: 0.5 },
});

describe('sizedSrc', () => {
  it('adds the transform to a legacy Cloudinary image, in the order the old helper produced', () => {
    const img = legacy('vantage/x');
    const url = (t: string) => `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,${t}/vantage/x`;
    expect(sizedSrc(img, 'h_240')).toBe(url('h_240'));
    expect(sizedSrc(img, 'w_64,h_64,c_fit')).toBe(url('w_64,h_64,c_fit'));
    expect(sizedSrc(img, 'w_800,h_946,c_fill,g_face')).toBe(url('w_800,h_946,c_fill,g_face'));
    expect(sizedSrc(img, 'w_1920')).toBe(url('w_1920'));
  });
  it('leaves library images untouched', () => {
    const img = { ...legacy('a'), id: '0b1c1c52-0000-4000-8000-000000000001', src: 'https://cdn.example/a.png' };
    expect(sizedSrc(img, 'w_64')).toBe('https://cdn.example/a.png');
  });
});
