import { describe, expect, it } from 'vitest';

import { cldUrl } from '@/lib/cloudinary/url';

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
  it('adds the transform to a legacy Cloudinary image, matching the old cldUrl output', () => {
    const img = legacy('vantage/x');
    expect(sizedSrc(img, 'h_240')).toBe(cldUrl('vantage/x', { height: 240 }));
    expect(sizedSrc(img, 'w_64,h_64,c_fit')).toBe(cldUrl('vantage/x', { width: 64, height: 64, crop: 'fit' }));
    expect(sizedSrc(img, 'w_800,h_946,c_fill,g_face')).toBe(
      cldUrl('vantage/x', { width: 800, height: 946, crop: 'fill', gravity: 'face' }),
    );
    expect(sizedSrc(img, 'w_1200,h_630,c_fill')).toBe(cldUrl('vantage/x', { width: 1200, height: 630, crop: 'fill' }));
    expect(sizedSrc(img, 'w_1920')).toBe(cldUrl('vantage/x', { width: 1920 }));
  });

  it('leaves library images untouched', () => {
    const img = { ...legacy('a'), id: '0b1c1c52-0000-4000-8000-000000000001', src: 'https://cdn.example/a.png' };
    expect(sizedSrc(img, 'w_64')).toBe('https://cdn.example/a.png');
  });
});
