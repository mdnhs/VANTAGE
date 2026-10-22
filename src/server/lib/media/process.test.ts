import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { gpsJpeg } from '../../../../tests/support/gps-jpeg';

import { MAX_UPLOAD_BYTES, MAX_VIDEO_BYTES, processUpload, withProcessingSlot } from './process';

const NOW = new Date(Date.UTC(2026, 0, 5));

describe('withProcessingSlot', () => {
  it('runs two at a time, queues eight and refuses the rest with 503', async () => {
    let active = 0;
    let peak = 0;
    const gates: (() => void)[] = [];
    const job = () =>
      withProcessingSlot(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise<void>((resolve) => gates.push(resolve));
        active--;
      });
    const jobs = Array.from({ length: 10 }, job);
    await expect(job()).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
      message: 'The server is busy processing uploads — try again in a moment',
    });
    while (gates.length > 0 || active > 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      gates.shift()?.();
    }
    await Promise.all(jobs);
    expect(peak).toBe(2);
    // Every slot is free again afterwards.
    await expect(withProcessingSlot(async () => 'ok')).resolves.toBe('ok');
  });
});

describe('processUpload', () => {
  const png = () =>
    sharp({ create: { width: 40, height: 20, channels: 3, background: { r: 10, g: 200, b: 10 } } })
      .png()
      .toBuffer();

  it('re-encodes an image and builds a prefixed, content-hashed key', async () => {
    const out = await processUpload(await png(), 'My Photo!.PNG', NOW);
    expect(out.key).toMatch(/^vantage\/media\/2026\/01\/[a-f0-9]{16}-my-photo\.png$/);
    expect(out).toMatchObject({ mimeType: 'image/png', width: 40, height: 20 });
    expect(out.blurDataUrl).toMatch(/^data:image\/webp/);
    expect(out.sizeBytes).toBe(out.body.length);
  });

  it('strips GPS EXIF from a camera JPEG', async () => {
    const out = await processUpload(await gpsJpeg(1024 * 1024), 'cam.jpg', NOW);
    const meta = await sharp(out.body).metadata();
    expect(meta.exif).toBeUndefined();
  }, 60_000);

  it('passes pdf through unchanged', async () => {
    const pdf = Buffer.from('%PDF-1.7\nhello');
    const out = await processUpload(pdf, 'Brochure.pdf', NOW);
    expect(out.body).toBe(pdf);
    expect(out.key).toMatch(/^vantage\/media\/2026\/01\/[a-f0-9]{16}-brochure\.pdf$/);
    expect(out.width).toBeNull();
  });

  it('skips sharp for video and keeps the bytes', async () => {
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(64)]);
    const out = await processUpload(mp4, 'clip.mov', NOW);
    expect(out.body).toBe(mp4);
    expect(out).toMatchObject({
      mimeType: 'video/mp4',
      width: null,
      height: null,
      blurDataUrl: null,
      dominantColor: null,
    });
    expect(out.key).toMatch(/\.mp4$/);
    const webm = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(16)]);
    expect((await processUpload(webm, 'a.webm', NOW)).key).toMatch(/\.webm$/);
  });

  it('applies a 20 MB cap to images and 100 MB to video', async () => {
    expect(MAX_UPLOAD_BYTES).toBe(20 * 1024 * 1024);
    expect(MAX_VIDEO_BYTES).toBe(100 * 1024 * 1024);
    const bigPdf = Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(MAX_UPLOAD_BYTES)]);
    await expect(processUpload(bigPdf, 'a.pdf', NOW)).rejects.toMatchObject({ status: 413 });
    const video = Buffer.concat([
      Buffer.from([0, 0, 0, 0x18]),
      Buffer.from('ftypisom'),
      Buffer.alloc(MAX_UPLOAD_BYTES),
    ]);
    await expect(processUpload(video, 'a.mp4', NOW)).resolves.toMatchObject({ mimeType: 'video/mp4' });
  });

  it('refuses unknown types (415) and undecodable images (422)', async () => {
    await expect(processUpload(Buffer.from('<svg/>'), 'a.svg', NOW)).rejects.toMatchObject({ status: 415 });
    await expect(
      processUpload(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(10)]), 'a.jpg', NOW),
    ).rejects.toMatchObject({ status: 422 });
  });
});
