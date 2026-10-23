import { describe, expect, it } from 'vitest';

import type { MediaRow } from '@/server/db/schema/media';

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

describe('toPublicImage', () => {
  it('uses a live row, with its focal point and alt', () => {
    expect(toPublicImage(row())).toEqual({
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

  it('returns null for a soft-deleted row, null or undefined', () => {
    expect(toPublicImage(row({ deletedAt: new Date() }))).toBeNull();
    expect(toPublicImage(null)).toBeNull();
    expect(toPublicImage(undefined)).toBeNull();
  });
});
