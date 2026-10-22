import { ApiError } from '@/server/lib/errors';

// Admission gate for admin uploads, in front of reading the multipart body: at most `running`
// uploads in flight and `queued` waiting behind them; the next one is refused with a 503 before
// any of its work (or body parsing) starts, so a burst cannot exhaust memory.
export const UPLOAD_ADMISSION = { running: 2, queued: 8 } as const;

type Waiter = { go: () => void };
let running = 0;
const waiting: Waiter[] = [];

// `signal` (the request's) drops a queued upload whose client went away, so it never takes a slot.
export async function withUploadAdmission<T>(work: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  if (running >= UPLOAD_ADMISSION.running) {
    if (waiting.length >= UPLOAD_ADMISSION.queued) {
      throw ApiError.busy('The server is busy. Try again in a moment.');
    }
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    await new Promise<void>((resolve, reject) => {
      const waiter: Waiter = { go: resolve };
      waiting.push(waiter);
      signal?.addEventListener(
        'abort',
        () => {
          const i = waiting.indexOf(waiter);
          if (i === -1) return; // already admitted
          waiting.splice(i, 1);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  } else {
    running++;
  }
  try {
    return await work();
  } finally {
    // Hand the slot straight to the next waiter, or free it.
    const next = waiting.shift();
    if (next) next.go();
    else running--;
  }
}
