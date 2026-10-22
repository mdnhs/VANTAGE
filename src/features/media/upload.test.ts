import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkFile, uploadMedia } from './upload';

class FakeXhr {
  static last: FakeXhr;
  upload = {
    onprogress: null as ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  status = 0;
  response: unknown = null;
  responseType = '';
  open = vi.fn();
  send = vi.fn(() => {
    FakeXhr.last = this;
  });
}

const sized = (name: string, type: string, bytes: number) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
};
const MB = 1024 * 1024;

afterEach(() => vi.unstubAllGlobals());

describe('checkFile', () => {
  it('rejects a 21 MB jpeg', () => {
    expect(checkFile(sized('a.jpg', 'image/jpeg', 21 * MB), 'image')).toMatch(/20 MB/);
  });
  it('accepts a 90 MB mp4 for video and refuses a 101 MB one', () => {
    expect(checkFile(sized('a.mp4', 'video/mp4', 90 * MB), 'video')).toBeNull();
    expect(checkFile(sized('a.mp4', 'video/mp4', 101 * MB), 'video')).toMatch(/100 MB/);
  });
  it('rejects an mp4 for image and a jpeg for video', () => {
    expect(checkFile(sized('a.mp4', 'video/mp4', MB), 'image')).not.toBeNull();
    expect(checkFile(sized('a.jpg', 'image/jpeg', MB), 'video')).not.toBeNull();
  });
  it('falls back to the extension when the browser gives no type, and rejects unknown ones', () => {
    expect(checkFile(sized('a.PNG', '', MB), 'image')).toBeNull();
    expect(checkFile(sized('a.exe', '', MB), 'any')).not.toBeNull();
  });
});

describe('uploadMedia', () => {
  it('forwards progress as percentages and resolves the stored item', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    const progress = vi.fn();
    const done = uploadMedia(new File(['x'], 'a.png', { type: 'image/png' }), progress, { url: '/x' });
    FakeXhr.last.upload.onprogress!({ lengthComputable: true, loaded: 5, total: 10 });
    Object.assign(FakeXhr.last, { status: 201, response: { success: true, data: { id: 'm1' } } });
    FakeXhr.last.onload!();
    await expect(done).resolves.toEqual({ id: 'm1' });
    expect(progress).toHaveBeenCalledWith(50);
  });

  it('turns the error envelope into an error with code and causes', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    const done = uploadMedia(new File(['x'], 'a.png', { type: 'image/png' }), () => {});
    Object.assign(FakeXhr.last, {
      status: 422,
      response: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nope', causes: { file: ['Nope'] } } },
    });
    FakeXhr.last.onload!();
    await expect(done).rejects.toMatchObject({ code: 'VALIDATION_ERROR', message: 'Nope', causes: { file: ['Nope'] } });
  });

  it('explains a bare 413 and a bare 503 in plain words', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    for (const [status, text, code] of [
      [413, /over 20 MB/, 'PAYLOAD_TOO_LARGE'],
      [503, /busy processing other uploads/, 'SERVICE_UNAVAILABLE'],
    ] as const) {
      const done = uploadMedia(new File(['x'], 'a.png', { type: 'image/png' }), () => {});
      Object.assign(FakeXhr.last, { status, response: null });
      FakeXhr.last.onload!();
      await expect(done).rejects.toMatchObject({ code, message: expect.stringMatching(text) });
    }
  });

  it('refuses a bad file without sending bytes', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    FakeXhr.last = undefined as never;
    await expect(uploadMedia(sized('a.mp4', 'video/mp4', MB), () => {}, { kind: 'image' })).rejects.toThrow();
    expect(FakeXhr.last).toBeUndefined();
  });
});
