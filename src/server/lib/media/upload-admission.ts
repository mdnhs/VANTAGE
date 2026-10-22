import { ApiError } from '@/server/lib/errors';

// Admission gate for admin uploads, in front of reading the multipart body: at most `running`
// uploads in flight and `queued` waiting behind them; the next one is refused with a 503 before
// any of its work (or body parsing) starts, so a burst cannot exhaust memory.
export const UPLOAD_ADMISSION = { running: 2, queued: 8 } as const;

let running = 0;
const waiting: (() => void)[] = [];

export async function withUploadAdmission<T>(work: () => Promise<T>): Promise<T> {
  if (running >= UPLOAD_ADMISSION.running) {
    if (waiting.length >= UPLOAD_ADMISSION.queued) {
      throw ApiError.serviceUnavailable('The server is busy. Try again in a moment.');
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    running++;
  }
  try {
    return await work();
  } finally {
    // Hand the slot straight to the next waiter, or free it.
    const next = waiting.shift();
    if (next) next();
    else running--;
  }
}
