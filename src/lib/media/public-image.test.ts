import { describe, expect, it } from 'vitest';

import { sizedSrc, type PublicImage } from './public-image';

const mockImage = (id: string | null, src: string): PublicImage => ({
  id,
  src,
  mimeType: 'image/webp',
  width: 800,
  height: 600,
  alt: 'Alt text',
  blurDataUrl: null,
  focal: { x: 0.5, y: 0.5 },
});

describe('sizedSrc', () => {
  it('returns the image src directly without transforms', () => {
    const img = mockImage('0b1c1c52-0000-4000-8000-000000000001', 'https://cdn.example/a.png');
    expect(sizedSrc(img, 'w_64')).toBe('https://cdn.example/a.png');
  });

  it('returns src directly even when id is null', () => {
    const img = mockImage(null, 'https://cdn.example/fallback.png');
    expect(sizedSrc(img, 'w_1920')).toBe('https://cdn.example/fallback.png');
  });
});
