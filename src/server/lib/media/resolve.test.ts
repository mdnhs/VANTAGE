import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MediaRow } from '@/server/db/schema/media';

import { legacyCloudinaryUrl } from './legacy-cloudinary';
import { toPublicImage } from './resolve';

const row = (over: Partial<MediaRow> = {}): MediaRow => ({
  id: '5c1b0f1e-3b49-4f5e-8a53-1a0c2b9d7e11',
  driver: 'local',
  key: 'vantage/media/2026/10/0123456789abcdef-a.png',
  scope: 'library',
  legacySource: null,
  url: '/uploads/vantage/media/2026/10/0123456789abcdef-a.png',
  filename: 'a.png',
  mimeType: 'image/png',
  sizeBytes: 10,
  width: 40,
  height: 30,
  blurDataUrl: 'data:image/png;base64,AA',
  dominantColor: null,
  alt: 'A car',
  caption: null,
  focalX: 0.2,
  focalY: 0.8,
  isDecorative: false,
  needsAlt: false,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...over,
});

const LEGACY = { publicId: 'vantage/x', resourceType: 'image' as const };

afterEach(() => vi.unstubAllEnvs());

describe('toPublicImage', () => {
  it('uses a live row, with its focal point and alt', () => {
    expect(toPublicImage(row(), LEGACY)).toEqual({
      id: '5c1b0f1e-3b49-4f5e-8a53-1a0c2b9d7e11',
      src: '/uploads/vantage/media/2026/10/0123456789abcdef-a.png',
      mimeType: 'image/png',
      width: 40,
      height: 30,
      alt: 'A car',
      blurDataUrl: 'data:image/png;base64,AA',
      focal: { x: 0.2, y: 0.8 },
    });
  });

  it('gives a decorative image empty alt', () => {
    expect(toPublicImage(row({ isDecorative: true }))?.alt).toBe('');
  });

  it('falls back to the legacy URL for a soft-deleted row or no row', () => {
    const expected = {
      id: null,
      src: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/vantage/x',
      mimeType: null,
      width: null,
      height: null,
      alt: '',
      blurDataUrl: null,
      focal: { x: 0.5, y: 0.5 },
    };
    expect(toPublicImage(row({ deletedAt: new Date() }), LEGACY)).toEqual(expected);
    expect(toPublicImage(null, LEGACY)).toEqual(expected);
    expect(toPublicImage(undefined, LEGACY)).toEqual(expected);
  });

  it('uses the video path for a legacy video', () => {
    expect(legacyCloudinaryUrl({ publicId: 'vantage/v', resourceType: 'video' })).toBe(
      'https://res.cloudinary.com/demo/video/upload/f_auto,q_auto/vantage/v',
    );
  });

  it('is null with nothing to show, or without a cloud name', () => {
    expect(toPublicImage(null)).toBeNull();
    expect(toPublicImage(row({ deletedAt: new Date() }))).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', '');
    expect(toPublicImage(null, LEGACY)).toBeNull();
  });
});
