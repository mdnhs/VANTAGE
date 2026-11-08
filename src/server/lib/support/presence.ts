// Who counts as online. An agent's streams are counted, and each one lingers for a grace period
// after it ends, so the routine stream recycle or a quick tab switch never shows them offline.
export function createPresence(agents: Map<string, number>, graceMs: number) {
  const change = (userId: string, by: number) => {
    const next = (agents.get(userId) ?? 0) + by;
    if (next > 0) agents.set(userId, next);
    else agents.delete(userId);
  };

  return {
    hold(userId: string): () => void {
      change(userId, 1);
      return () => {
        setTimeout(() => change(userId, -1), graceMs).unref?.();
      };
    },
    isOnline: (userId: string) => agents.has(userId),
    anyOnline: () => agents.size > 0,
  };
}
