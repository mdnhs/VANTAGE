// jsonb returns object keys in its own order, so compare with sorted keys.
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

// Audit diffs at the first level: enough to see what moved, small enough to keep
// in the log. Matches the `diff` shape `audit()` stores.
export function topLevelDiff(before: unknown, after: unknown): Record<string, { from: unknown; to: unknown }> {
  const a = (before ?? {}) as Record<string, unknown>;
  const b = (after ?? {}) as Record<string, unknown>;
  const diff: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (canonical(a[key]) !== canonical(b[key])) {
      diff[key] = { from: a[key] ?? null, to: b[key] ?? null };
    }
  }
  return diff;
}
