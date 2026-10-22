import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as serveUpload } from '@/app/uploads/[...key]/route';
import { api } from '@/server/api';
import { db } from '@/server/db';
import { auditLogs, settings } from '@/server/db/schema';
import { MAX_VIDEO_BYTES } from '@/server/lib/media/process';
import { resetStorageForTests } from '@/server/lib/media/storage';
import type { MediaItem } from '@/server/services/media-library-service';

import { mediaLibraryService } from '@/server/services/media-library-service';

import { createTestUser, ORIGIN, sessionCookie, viewAsCookie } from '../support/session';

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
}));

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
  api.request(BASE, { method: 'POST', headers: { origin: ORIGIN, ...headers }, body: form(bytes, name) });

const json = async (res: Response) => (await res.json()) as { data: MediaItem & MediaItem[] };

describe('admin media API', () => {
  beforeAll(async () => {
    cookie = await sessionCookie('owner');
    resetStorageForTests();
  });

  beforeEach(async () => {
    await db.execute(sql`truncate table media cascade`);
    await db.execute(sql`truncate table audit_logs`);
    await db.execute(sql`delete from settings`);
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
        headers: { origin: ORIGIN, cookie, 'content-type': 'application/json' },
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
        headers: { origin: ORIGIN, cookie, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    await patch(withAlt.id, { alt: 'described' });
    await patch(decorative.id, { isDecorative: true });

    const list = await json(await api.request(`${BASE}?missingAlt=true`, { headers: { cookie } }));
    expect(list.data.map((m: { id: string }) => m.id)).toEqual([noAlt.id]);

    const del = await api.request(`${BASE}/${noAlt.id}`, { method: 'DELETE', headers: { origin: ORIGIN, cookie } });
    expect(del.status).toBe(200);
    const after = await json(await api.request(BASE, { headers: { cookie } }));
    expect(after.data.map((m: { id: string }) => m.id)).not.toContain(noAlt.id);
    expect((await api.request(`${BASE}/${noAlt.id}`, { headers: { cookie } })).status).toBe(404);
  });

  it('replace keeps the id and swaps the file', async () => {
    const { data } = await json(await upload(await png('#111'), 'a.png'));
    const res = await api.request(`${BASE}/${data.id}/replace`, {
      method: 'POST',
      headers: { origin: ORIGIN, cookie },
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
      headers: { origin: ORIGIN, cookie },
      body: form(mp4, 'clip.mp4'),
    });
    expect(res.status).toBe(422);
    expect((await json(await api.request(`${BASE}/${data.id}`, { headers: { cookie } }))).data.url).toBe(data.url);
  });

  it('rejects a body over the request cap with 413 before parsing', async () => {
    const big = new Uint8Array(MAX_VIDEO_BYTES + 2 * 1024 * 1024);
    for (const url of [BASE, `${BASE}/00000000-0000-4000-8000-000000000000/replace`]) {
      const res = await api.request(url, {
        method: 'POST',
        headers: { origin: ORIGIN, cookie },
        body: form(big, 'huge.mp4'),
      });
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
  describe('references, ownership and audit', () => {
    const del = (id: string, c = cookie) =>
      api.request(`${BASE}/${id}`, { method: 'DELETE', headers: { origin: ORIGIN, cookie: c } });
    const patch = (id: string, body: object, c = cookie) =>
      api.request(`${BASE}/${id}`, {
        method: 'PATCH',
        headers: { origin: ORIGIN, cookie: c, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    const audits = async (action: string) => db.select().from(auditLogs).where(eq(auditLogs.action, action));

    it('refuses to delete an item a setting still names (409 with usage)', async () => {
      const { data } = await json(await upload(await png('#101'), 'used.png'));
      await db.insert(settings).values({ key: 'site', value: { logo: { kind: 'media', id: data.id } } });
      const res = await del(data.id);
      expect(res.status).toBe(409);
      const body = (await res.json()) as {
        error: { message: string; details: { usage: { kind: string; label: string; href: string | null }[] } };
      };
      expect(body.error.message).toBe('This file is still in use');
      expect(body.error.details.usage[0]).toMatchObject({ kind: 'setting', label: 'Identity' });
      expect((await api.request(`${BASE}/${data.id}`, { headers: { cookie } })).status).toBe(200);
    });

    it('deletes an unreferenced item and drops it from the list', async () => {
      const { data } = await json(await upload(await png('#202'), 'free.png'));
      expect((await del(data.id)).status).toBe(200);
      const list = await json(await api.request(BASE, { headers: { cookie } }));
      expect(list.data.map((m: { id: string }) => m.id)).not.toContain(data.id);
    });

    it('GET /:id/usage returns the real usage', async () => {
      const { data } = await json(await upload(await png('#303'), 'u.png'));
      await db.insert(settings).values({ key: 'footer', value: { image: data.id } });
      const res = await api.request(`${BASE}/${data.id}/usage`, { headers: { cookie } });
      const body = (await res.json()) as { data: { kind: string }[] };
      expect(body.data.map((u) => u.kind)).toEqual(['setting']);
    });

    it('lets an author change only their own files', async () => {
      const authorCookie = await sessionCookie('author');
      const owners = (await json(await upload(await png('#404'), 'owner.png'))).data;
      const mine = (await json(await upload(await png('#505'), 'mine.png', { cookie: authorCookie }))).data;
      const denied = await patch(owners.id, { alt: 'nope' }, authorCookie);
      expect(denied.status).toBe(403);
      expect(((await denied.json()) as { error: { message: string } }).error.message).toBe(
        'You can only edit your own files',
      );
      expect((await patch(mine.id, { alt: 'mine' }, authorCookie)).status).toBe(200);
      const replaceOwners = await api.request(`${BASE}/${owners.id}/replace`, {
        method: 'POST',
        headers: { origin: ORIGIN, cookie: authorCookie },
        body: form(await png('#606'), 'x.png'),
      });
      expect(replaceOwners.status).toBe(403);
    });

    it('lists exactly the requested ids', async () => {
      const a = (await json(await upload(await png('#701'), 'a.png'))).data;
      const b = (await json(await upload(await png('#702'), 'b.png'))).data;
      await upload(await png('#703'), 'c.png');
      const res = await api.request(`${BASE}?ids=${a.id},${b.id}`, { headers: { cookie } });
      const ids = (await json(res)).data.map((m: { id: string }) => m.id).sort();
      expect(ids).toEqual([a.id, b.id].sort());
      expect((await api.request(`${BASE}?ids=not-a-uuid`, { headers: { cookie } })).status).toBe(422);
    });

    it('never lists enquiry-scope media', async () => {
      const row = await mediaLibraryService.ingest({
        bytes: await png('#801'),
        filename: 'lead.png',
        actorId: null,
        scope: 'enquiry',
      });
      const list = await json(await api.request(BASE, { headers: { cookie } }));
      expect(list.data.map((m: { id: string }) => m.id)).not.toContain(row.id);
      expect((await api.request(`${BASE}/${row.id}`, { headers: { cookie } })).status).toBe(200);
    });

    it('ingest with a legacySource is idempotent', async () => {
      const input = {
        bytes: await png('#901'),
        filename: 'legacy.png',
        actorId: null,
        scope: 'library' as const,
        legacySource: 'cloudinary:image:vantage/x',
      };
      const first = await mediaLibraryService.ingest(input);
      const second = await mediaLibraryService.ingest({ ...input, bytes: await png('#902') });
      expect(second.id).toBe(first.id);
      expect(second.key).toBe(first.key);
    });

    it('hardDeleteEnquiryMedia removes unlinked enquiry rows and their files only', async () => {
      const lead = await mediaLibraryService.ingest({
        bytes: await png('#a01'),
        filename: 'lead.png',
        actorId: null,
        scope: 'enquiry',
      });
      const lib = await mediaLibraryService.ingest({
        bytes: await png('#a02'),
        filename: 'lib.png',
        actorId: null,
        scope: 'library',
      });
      expect(await mediaLibraryService.hardDeleteEnquiryMedia([lead.id, lib.id])).toBe(1);
      expect(existsSync(path.join(UPLOAD_DIR, lead.key))).toBe(false);
      expect(existsSync(path.join(UPLOAD_DIR, lib.key))).toBe(true);
    });

    it('writes one audit row per upload, update, replace and delete', async () => {
      const { data } = await json(await upload(await png('#b01'), 'audit.png'));
      await patch(data.id, { alt: 'described' });
      await api.request(`${BASE}/${data.id}/replace`, {
        method: 'POST',
        headers: { origin: ORIGIN, cookie },
        body: form(await png('#b02'), 'again.png'),
      });
      await del(data.id);
      for (const action of ['media.upload', 'media.update', 'media.replace', 'media.delete']) {
        expect(await audits(action), action).toHaveLength(1);
      }
      const [update] = await audits('media.update');
      expect(update?.diff).toMatchObject({ alt: { from: '', to: 'described' } });
    });
  });
  it('refuses every write while viewing as someone (403) but still lists', async () => {
    const { data } = await json(await upload(await png('#c01'), 'va.png'));
    const target = await createTestUser('editor');
    const viewing = await viewAsCookie(cookie, target.id);
    expect((await upload(await png('#c02'), 'x.png', { cookie: viewing })).status).toBe(403);
    const patch = await api.request(`${BASE}/${data.id}`, {
      method: 'PATCH',
      headers: { origin: ORIGIN, cookie: viewing, 'content-type': 'application/json' },
      body: JSON.stringify({ alt: 'nope' }),
    });
    expect(patch.status).toBe(403);
    const replace = await api.request(`${BASE}/${data.id}/replace`, {
      method: 'POST',
      headers: { origin: ORIGIN, cookie: viewing },
      body: form(await png('#c03'), 'y.png'),
    });
    expect(replace.status).toBe(403);
    const del = await api.request(`${BASE}/${data.id}`, {
      method: 'DELETE',
      headers: { origin: ORIGIN, cookie: viewing },
    });
    expect(del.status).toBe(403);
    expect(((await del.json()) as { error: { code: string } }).error.code).toBe('IMPERSONATION_READ_ONLY');
    expect((await api.request(BASE, { headers: { cookie: viewing } })).status).toBe(200);
  });
});
