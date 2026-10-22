import { describe, expect, it, vi } from 'vitest';

import { UPLOAD_ADMISSION, withUploadAdmission } from './upload-admission';

const gate = () => {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => (release = resolve));
  return { promise, release };
};

describe('withUploadAdmission', () => {
  it('admits 2 running + 8 queued, refuses the 11th with 503 before its work runs', async () => {
    expect(UPLOAD_ADMISSION).toEqual({ running: 2, queued: 8 });
    const gates = Array.from({ length: 10 }, gate);
    const started = vi.fn();
    const pending = gates.map((g, i) =>
      withUploadAdmission(async () => {
        started(i);
        await g.promise;
        return i;
      }),
    );
    await Promise.resolve();
    expect(started).toHaveBeenCalledTimes(2);

    const work = vi.fn(async () => 'x');
    await expect(withUploadAdmission(work)).rejects.toMatchObject({
      status: 503,
      message: 'The server is busy. Try again in a moment.',
    });
    expect(work).not.toHaveBeenCalled();

    // a finished slot admits the next waiter, and a fresh upload fits again
    gates[0]!.release();
    await pending[0];
    await Promise.resolve();
    expect(started).toHaveBeenCalledTimes(3);
    const late = withUploadAdmission(async () => 'late');
    gates.forEach((g) => g.release());
    await Promise.all(pending);
    await expect(late).resolves.toBe('late');
  });

  it('drops a queued upload whose request was aborted', async () => {
    const g = gate();
    const held = [withUploadAdmission(() => g.promise), withUploadAdmission(() => g.promise)];
    const ac = new AbortController();
    const work = vi.fn(async () => 'x');
    const queued = withUploadAdmission(work, ac.signal);
    ac.abort();
    await expect(queued).rejects.toMatchObject({ name: 'AbortError' });
    g.release();
    await Promise.all(held);
    expect(work).not.toHaveBeenCalled();
    await expect(withUploadAdmission(async () => 'ok')).resolves.toBe('ok');
  });

  it('frees the slot when work throws', async () => {
    await expect(withUploadAdmission(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(withUploadAdmission(async () => 'ok')).resolves.toBe('ok');
  });
});
