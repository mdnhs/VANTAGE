import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { sql } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { GET as serveUpload } from '@/app/uploads/[...key]/route';
import { api } from '@/server/api';
import { db } from '@/server/db';
import { MAX_VIDEO_BYTES } from '@/server/lib/media/process';
import { resetStorageForTests } from '@/server/lib/media/storage';
import type { MediaItem } from '@/server/services/media-library-service';

import { sessionCookie } from '../support/session';

const BASE = '/api/v1/admin/media';
const UPLOAD_DIR = path.resolve('.test-uploads');

let cookie: string;

const png = (color = '#c33') =>
  sharp({ create: { width: 32, height: 24, channels: 3, background: color } })
    .png()
    .toBuffer();

const form = (bytes: Uint8Array, name: string, type = 'application/octet-stream') => {
  const body = new FormData();
  body.set('file', new File([bytes as BlobPart], name, { type }));
  return body;
};

const upload = (bytes: Uint8Array, name: string, headers: Record<string, string> = { cookie }) =>
  api.request(BASE, { method: 'POST', headers, body: form(bytes, name) });

const json = async (res: Response) => (await res.json()) as { data: MediaItem & MediaItem[] };

describe('admin media API', () => {
  beforeAll(async () => {
    cookie = await sessionCookie('owner');
    resetStorageForTests();
  });

  beforeEach(async () => {
    await db.execute(sql`truncate table media`);
  });

  afterAll(async () => {
    await rm(UPLOAD_DIR, { recursive: true, force: true });
  });

  it('rejects unauthenticated requests', async () => {
    const res = await upload(await png(), 'a.png', {});
    expect(res.status).toBe(401);
  });

  it('uploads a PNG and writes it to disk', async () => {
    const res = await upload(await png(), 'Hello World.png');
    expect(res.status).toBe(201);
    const { data } = await json(res);
    expect(data.mimeType).toBe('image/png');
    expect(data.url.startsWith('/uploads/vantage/media/')).toBe(true);
    expect(data.width).toBe(32);
    expect(existsSync(path.join(UPLOAD_DIR, data.url.replace('/uploads/', '')))).toBe(true);
  });

  it('gives a second upload of the same bytes its own key and row', async () => {
    const bytes = await png();
    const a = (await json(await upload(bytes, 'same.png'))).data;
    const b = (await json(await upload(bytes, 'same.png'))).data;
    expect(a.url).not.toBe(b.url);
    expect(a.id).not.toBe(b.id);
    const list = await json(await api.request(BASE, { headers: { cookie } }));
    expect(list.data).toHaveLength(2);
  });

  it('refuses a 21 MB PNG with 413', async () => {
    const big = Buffer.concat([await png(), Buffer.alloc(21 * 1024 * 1024)]);
    const res = await upload(big, 'big.png');
    expect(res.status).toBe(413);
  });

  it('refuses html named .jpg with 415', async () => {
    const res = await upload(Buffer.from('<html><script>alert(1)</script></html>'), 'x.jpg');
    expect(res.status).toBe(415);
  });

  it('accepts an mp4 with null dimensions', async () => {
    const mp4 = Buffer.concat([
      Buffer.from([0, 0, 0, 24]),
      Buffer.from('ftypisom'),
      Buffer.from([0, 0, 2, 0]),
      Buffer.from('isomiso2'),
      Buffer.alloc(64),
    ]);
    const res = await upload(mp4, 'clip.mp4');
    expect(res.status).toBe(201);
    const { data } = await json(res);
    expect(data.mimeType).toBe('video/mp4');
    expect(data.width).toBeNull();
  });

  it('PATCH rejects alt over 300 chars and clears needsAlt on valid alt', async () => {
    const { data } = await json(await upload(await png(), 'p.png'));
    const patch = (alt: string) =>
      api.request(`${BASE}/${data.id}`, {
        method: 'PATCH',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ alt }),
      });
    expect((await patch('x'.repeat(301))).status).toBe(422);
    const res = await patch('A red square');
    expect(res.status).toBe(200);
    const updated = (await json(res)).data;
    expect(updated.alt).toBe('A red square');
    expect(updated.needsAlt).toBe(false);
  });

  it('filters missingAlt and hides soft-deleted items', async () => {
    const noAlt = (await json(await upload(await png('#111'), 'a.png'))).data;
    const withAlt = (await json(await upload(await png('#222'), 'b.png'))).data;
    const decorative = (await json(await upload(await png('#333'), 'c.png'))).data;
    const patch = (id: string, body: object) =>
      api.request(`${BASE}/${id}`, {
        method: 'PATCH',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    await patch(withAlt.id, { alt: 'described' });
    await patch(decorative.id, { isDecorative: true });

    const list = await json(await api.request(`${BASE}?missingAlt=true`, { headers: { cookie } }));
    expect(list.data.map((m: { id: string }) => m.id)).toEqual([noAlt.id]);

    const del = await api.request(`${BASE}/${noAlt.id}`, { method: 'DELETE', headers: { cookie } });
    expect(del.status).toBe(200);
    const after = await json(await api.request(BASE, { headers: { cookie } }));
    expect(after.data.map((m: { id: string }) => m.id)).not.toContain(noAlt.id);
    expect((await api.request(`${BASE}/${noAlt.id}`, { headers: { cookie } })).status).toBe(404);
  });

  it('replace keeps the id and swaps the file', async () => {
    const { data } = await json(await upload(await png('#111'), 'a.png'));
    const res = await api.request(`${BASE}/${data.id}/replace`, {
      method: 'POST',
      headers: { cookie },
      body: form(await png('#999'), 'b.png'),
    });
    expect(res.status).toBe(200);
    const replaced = (await json(res)).data;
    expect(replaced.id).toBe(data.id);
    expect(replaced.url).not.toBe(data.url);
  });

  it('refuses to replace an image with a video (422)', async () => {
    const { data } = await json(await upload(await png('#111'), 'a.png'));
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(64)]);
    const res = await api.request(`${BASE}/${data.id}/replace`, {
      method: 'POST',
      headers: { cookie },
      body: form(mp4, 'clip.mp4'),
    });
    expect(res.status).toBe(422);
    expect((await json(await api.request(`${BASE}/${data.id}`, { headers: { cookie } }))).data.url).toBe(data.url);
  });

  it('rejects a body over the request cap with 413 before parsing', async () => {
    const big = new Uint8Array(MAX_VIDEO_BYTES + 2 * 1024 * 1024);
    for (const url of [BASE, `${BASE}/00000000-0000-4000-8000-000000000000/replace`]) {
      const res = await api.request(url, { method: 'POST', headers: { cookie }, body: form(big, 'huge.mp4') });
      expect(res.status).toBe(413);
    }
  }, 60_000);

  it('serves uploaded files with immutable caching and rejects bad keys', async () => {
    const { data } = await json(await upload(await png(), 'serve.png'));
    const get = (key: string) =>
      serveUpload(new Request(`http://localhost/uploads/${key}`), {
        params: Promise.resolve({ key: key.split('/') }),
      } as Parameters<typeof serveUpload>[1]);
    const res = await get(data.url.replace('/uploads/', ''));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect((await get('vantage/media/../../etc/passwd')).status).toBe(404);
    expect((await get('vantage/media/2026/01/0123456789abcdef-missing.png')).status).toBe(404);
  });
});
