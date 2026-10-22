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

import { ORIGIN, sessionCookie } from '../support/session';

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
    body: JSON.stringify(body),
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
    const heic = `data:image/heic;base64,${Buffer.from('xx').toString('base64')}`;
    const res = await post('/quotes', { ...quote, photoUrls: [garbage, await dataUrl('#c33'), heic] });
    expect(res.status).toBe(201);
    expect(await db.select().from(quoteRequests)).toHaveLength(1);
    expect(await db.select().from(enquiryPhotos)).toHaveLength(1);
    expect(await db.select().from(media)).toHaveLength(1);
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

  it('admin detail and list return photos with legacy urls last', async () => {
    await post('/quotes', { ...quote, photoUrls: [await dataUrl('#c33')] });
    const [row] = await db.select().from(quoteRequests);
    const legacy = 'https://res.cloudinary.com/demo/image/upload/v1/vantage/quotes/old.jpg';
    await db
      .update(quoteRequests)
      .set({ photoUrls: [legacy] })
      .where(eq(quoteRequests.id, row!.id));

    const detail = (await (await get(`/quotes/${row!.id}`, cookie)).json()) as {
      data: { photos: { id: string | null; url: string; width: number | null }[] };
    };
    expect(detail.data.photos).toHaveLength(2);
    expect(detail.data.photos[0]).toMatchObject({ width: 40 });
    expect(detail.data.photos[0]!.id).not.toBeNull();
    expect(detail.data.photos[1]).toEqual({ id: null, url: legacy, width: null, height: null });
    expect(detail.data).not.toHaveProperty('photoUrls');

    const list = (await (await get('/quotes/admin/list', cookie)).json()) as { data: { photos: unknown[] }[] };
    expect(list.data[0]!.photos).toHaveLength(2);
  });

  it('writes the processed file to storage', async () => {
    await post('/quotes', { ...quote, photoUrls: [await dataUrl('#c33')] });
    const [m] = await db.select().from(media);
    expect(existsSync(path.join(UPLOAD_DIR, m!.key))).toBe(true);
  });
});
