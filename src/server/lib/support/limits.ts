// A fixed-window allowance for one process, for things that must have a site-wide ceiling.
export function createBudget(limit: number, windowMs: number) {
  let used = 0;
  let resetAt = 0;
  return {
    take(): boolean {
      const now = Date.now();
      if (now >= resetAt) {
        used = 0;
        resetAt = now + windowMs;
      }
      if (used >= limit) return false;
      used += 1;
      return true;
    },
  };
}

// One timer per waiting chat, started by the first unanswered message. Held in memory: a chat
// waiting at the moment of a deploy loses its alert, but stays unread in the inbox.
export function createNoReplyTimers(delayMs: number, onDue: (id: string) => void) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  return {
    schedule(id: string) {
      if (timers.has(id)) return;
      const timer = setTimeout(() => {
        timers.delete(id);
        onDue(id);
      }, delayMs);
      timer.unref?.();
      timers.set(id, timer);
    },
    cancel(id: string) {
      clearTimeout(timers.get(id));
      timers.delete(id);
    },
  };
}
