import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { asc, eq, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/server/api';
import { db } from '@/server/db';
import { contactMessages, enquiryPhotos, media, quoteRequests } from '@/server/db/schema';
import { resetStorageForTests } from '@/server/lib/media/storage';

import { ORIGIN, sessionCookie, stamped } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
}));

const UPLOAD_DIR = path.resolve('.test-uploads');

const dataUrl = async (color: string) =>
  `data:image/jpeg;base64,${(
    await sharp({ create: { width: 40, height: 30, channels: 3, background: color } })
      .jpeg()
      .toBuffer()
  ).toString('base64')}`;

const post = (route: string, body: unknown) =>
  api.request(`/api/v1${route}`, {
    method: 'POST',
    headers: { origin: ORIGIN, 'content-type': 'application/json' },
    body: JSON.stringify(stamped(body)),
  });
const get = (route: string, cookie: string) => api.request(`/api/v1${route}`, { headers: { origin: ORIGIN, cookie } });

const quote = { name: 'Pat', email: 'pat@example.com', phone: '0871234567' };
const contact = { firstName: 'Pat', lastName: 'Q', email: 'pat@example.com', phone: '0871234567', message: 'hi' };

let cookie: string;

describe('enquiry photos through the media pipeline', () => {
  beforeAll(async () => {
    cookie = await sessionCookie('owner');
    resetStorageForTests();
  });
  beforeEach(async () => {
    await db.execute(sql`truncate table enquiry_photos, quote_requests, contact_messages, media cascade`);
  });
  afterAll(async () => {
    await rm(UPLOAD_DIR, { recursive: true, force: true });
  });

  it('stores two quote photos as enquiry media, linked in order, never in the library', async () => {
    const res = await post('/quotes', { ...quote, photoUrls: [await dataUrl('#c33'), await dataUrl('#33c')] });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: Record<string, unknown> };
    expect(body.data).not.toHaveProperty('photos');
    expect(JSON.stringify(body.data)).not.toMatch(/uploads|vantage\/media/);

    const links = await db.select().from(enquiryPhotos).orderBy(asc(enquiryPhotos.position));
    expect(links.map((l) => l.position)).toEqual([0, 1]);
    const rows = await db.select().from(media);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.scope === 'enquiry' && r.createdBy === null)).toBe(true);
    expect(links.map((l) => l.mediaId)).toEqual(
      [...rows]
        .sort((a, b) => links.findIndex((l) => l.mediaId === a.id) - links.findIndex((l) => l.mediaId === b.id))
        .map((r) => r.id),
    );

    const list = (await (await get('/admin/media', cookie)).json()) as { data: unknown[] };
    expect(list.data).toHaveLength(0);
  });

  it('refuses a fifth photo and a non-data-url string with 422', async () => {
    const one = await dataUrl('#111');
    expect((await post('/quotes', { ...quote, photoUrls: [one, one, one, one, one] })).status).toBe(422);
    expect((await post('/quotes', { ...quote, photoUrls: ['https://evil.example/x.jpg'] })).status).toBe(422);
    expect((await post('/contacts', { ...contact, photoUrls: ['https://evil.example/x.jpg'] })).status).toBe(422);
    expect(await db.select().from(quoteRequests)).toHaveLength(0);
  });

  it('skips a photo that is not a decodable image and still saves the enquiry', async () => {
    const garbage = `data:image/png;base64,${Buffer.from('not an image at all').toString('base64')}`;
    const res = await post('/quotes', { ...quote, photoUrls: [garbage, await dataUrl('#c33')] });
    expect(res.status).toBe(201);
    expect(await db.select().from(quoteRequests)).toHaveLength(1);
    expect(await db.select().from(enquiryPhotos)).toHaveLength(1);
    expect(await db.select().from(media)).toHaveLength(1);
  });

  it('refuses HEIC and GIF photos with a 422 that names the allowed types, and stores nothing', async () => {
    for (const type of ['heic', 'gif']) {
      const odd = `data:image/${type};base64,${Buffer.from('xx').toString('base64')}`;
      for (const [route, body] of [
        ['/quotes', quote],
        ['/contacts', contact],
      ] as const) {
        const res = await post(route, { ...body, photoUrls: [await dataUrl('#c33'), odd] });
        expect(res.status).toBe(422);
        const err = (await res.json()) as { error: { causes?: Record<string, string[]> } };
        expect(JSON.stringify(err.error.causes)).toMatch(/JPG, PNG, WebP or AVIF/);
      }
    }
    expect(await db.select().from(quoteRequests)).toHaveLength(0);
    expect(await db.select().from(contactMessages)).toHaveLength(0);
    expect(await db.select().from(media)).toHaveLength(0);
  });

  it('skips renamed PDFs and videos and oversized photos; nothing is stored for them', async () => {
    const as = (type: string, bytes: Buffer) => `data:image/${type};base64,${bytes.toString('base64')}`;
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n%%EOF');
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(40)]);
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(21 * 1024 * 1024)]);
    const res = await post('/quotes', {
      ...quote,
      photoUrls: [as('jpeg', pdf), as('png', mp4), as('jpeg', big)],
    });
    expect(res.status).toBe(201);
    expect(await db.select().from(quoteRequests)).toHaveLength(1);
    expect(await db.select().from(media)).toHaveLength(0);
    expect(await db.select().from(enquiryPhotos)).toHaveLength(0);
  });

  it('skips a real image whose bytes do not match the declared type', async () => {
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#111' } })
      .png()
      .toBuffer();
    const res = await post('/quotes', { ...quote, photoUrls: [`data:image/jpeg;base64,${png.toString('base64')}`] });
    expect(res.status).toBe(201);
    expect(await db.select().from(media)).toHaveLength(0);
  });

  it('validates the enquiry before storing any photo', async () => {
    const res = await post('/quotes', { name: '', email: 'x', phone: '1', photoUrls: [await dataUrl('#c33')] });
    expect(res.status).toBe(422);
    expect(await db.select().from(media)).toHaveLength(0);
  });

  it('takes the same path for contact messages', async () => {
    const res = await post('/contacts', { ...contact, photoUrls: [await dataUrl('#c33'), await dataUrl('#33c')] });
    expect(res.status).toBe(201);
    const links = await db.select().from(enquiryPhotos);
    expect(links).toHaveLength(2);
    expect(links.every((l) => l.contactMessageId !== null && l.quoteRequestId === null)).toBe(true);
    const [row] = await db.select().from(contactMessages);
    const detail = (await (await get(`/contacts/${row!.id}`, cookie)).json()) as {
      data: { photos: { id: string | null; url: string }[] };
    };
    expect(detail.data.photos).toHaveLength(2);
  });

  it('a quote with only photo_urls returns photos: []', async () => {
    const res = await post('/quotes', quote);
    expect(res.status).toBe(201);
    const [row] = await db.select().from(quoteRequests);
    const legacy = 'https://res.cloudinary.com/demo/image/upload/v1/vantage/quotes/old.jpg';
    await db
      .update(quoteRequests)
      .set({ photoUrls: [legacy] })
      .where(eq(quoteRequests.id, row!.id));

    const detail = (await (await get(`/quotes/${row!.id}`, cookie)).json()) as {
      data: { photos: { id: string | null; url: string; width: number | null }[] };
    };
    expect(detail.data.photos).toEqual([]);
    expect(detail.data).not.toHaveProperty('photoUrls');

    const list = (await (await get('/quotes/admin/list', cookie)).json()) as { data: { photos: unknown[] }[] };
    expect(list.data[0]!.photos).toEqual([]);
  });

  it('writes the processed file to storage', async () => {
    await post('/quotes', { ...quote, photoUrls: [await dataUrl('#c33')] });
    const [m] = await db.select().from(media);
    expect(existsSync(path.join(UPLOAD_DIR, m!.key))).toBe(true);
  });
});
