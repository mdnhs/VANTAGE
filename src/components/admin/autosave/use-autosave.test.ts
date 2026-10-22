// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAutosave } from './use-autosave';

afterEach(() => {
  vi.useRealTimers();
});

class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly current?: { version: number; updatedAt: string | null; updatedBy: string | null },
  ) {
    super(message);
  }
}

const bump = async (_value: string, version: number) => ({ version: version + 1 });

describe('useAutosave', () => {
  it('debounces and sends the latest value with the current version', async () => {
    vi.useFakeTimers();
    const save = vi.fn(bump);
    const { result } = renderHook(() => useAutosave({ version: 1, save }));
    act(() => {
      result.current.schedule('a');
      result.current.schedule('b');
    });
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('b', 1);
    act(() => result.current.schedule('c'));
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(save).toHaveBeenLastCalledWith('c', 2);
    expect(result.current.state.status).toBe('saved');
  });

  // Nothing is sent over someone else's change.
  it('stops on a 409 until the editor overwrites with the server version', async () => {
    vi.useFakeTimers();
    const conflict = new HttpError('Changed', 409, { version: 7, updatedAt: null, updatedBy: 'Eve' });
    const save = vi.fn(bump).mockRejectedValueOnce(conflict);
    const { result } = renderHook(() => useAutosave({ version: 1, save }));
    act(() => result.current.schedule('a'));
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(result.current.state).toMatchObject({ status: 'conflict', conflict: { updatedBy: 'Eve', version: 7 } });
    act(() => result.current.schedule('b'));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(save).toHaveBeenCalledTimes(1);
    await act(() => result.current.overwrite());
    expect(save).toHaveBeenLastCalledWith('b', 7);
    expect(result.current.state.status).toBe('saved');
  });

  it('flush reports whether everything is saved', async () => {
    const save = vi.fn(bump).mockRejectedValueOnce(new TypeError('offline'));
    const { result } = renderHook(() => useAutosave({ version: 1, save }));
    act(() => result.current.schedule('a'));
    let ok = true;
    await act(async () => {
      ok = await result.current.flush();
    });
    expect(ok).toBe(false);
    await act(async () => {
      ok = await result.current.flush();
    });
    expect(ok).toBe(true);
    expect(result.current.getVersion()).toBe(2);
  });

  it('saves a pending edit when the editor unmounts', async () => {
    const save = vi.fn(bump);
    const { result, unmount } = renderHook(() => useAutosave({ version: 1, save }));
    act(() => result.current.schedule('a'));
    unmount();
    await vi.waitFor(() => expect(save).toHaveBeenCalledWith('a', 1));
  });

  // A 409 from publish/restore has nothing queued: Overwrite re-sends the
  // newest edit, or just closes the conflict.
  it('overwrite re-sends the latest edit after an outside conflict', async () => {
    const save = vi.fn(bump);
    const { result } = renderHook(() => useAutosave({ version: 1, save }));
    act(() => result.current.markConflict({ version: 4, updatedAt: null, updatedBy: 'Eve' }));
    await act(() => result.current.overwrite());
    expect(save).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe('idle');

    act(() => result.current.schedule('a'));
    await act(async () => {
      await result.current.flush();
    });
    act(() => result.current.markConflict({ version: 9, updatedAt: null, updatedBy: 'Eve' }));
    await act(() => result.current.overwrite());
    expect(save).toHaveBeenLastCalledWith('a', 9);
    expect(result.current.state.status).toBe('saved');
  });

  // Publish must not race autosave on the same version.
  it('exclusive waits for an in-flight save and queues edits made meanwhile', async () => {
    vi.useFakeTimers();
    const save = vi.fn(bump);
    const { result } = renderHook(() => useAutosave({ version: 1, save }));
    act(() => result.current.schedule('a'));
    let finish: (value: { version: number }) => void = () => {};
    const request = vi.fn(
      () =>
        new Promise<{ version: number }>((resolve) => {
          finish = resolve;
        }),
    );
    let publishing: Promise<unknown> = Promise.resolve();
    await act(async () => {
      publishing = result.current.exclusive(request);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('a', 1);
    expect(request).toHaveBeenCalledWith(2);
    act(() => result.current.schedule('b'));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish({ version: 3 });
      await publishing;
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(save).toHaveBeenLastCalledWith('b', 3);
  });

  it('does not retry a permanent failure', async () => {
    vi.useFakeTimers();
    const save = vi.fn(bump).mockRejectedValue(new HttpError('No', 403));
    const { result } = renderHook(() => useAutosave({ version: 1, save }));
    act(() => result.current.schedule('a'));
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.state).toMatchObject({ status: 'error', error: 'No' });
  });
});
