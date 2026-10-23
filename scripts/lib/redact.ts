// Drizzle query errors embed the SQL params (password hashes) in `message`.
// Print only the driver's code/detail/message, and scrub anything secret-shaped.
const SECRET_PATTERNS = [/\$2[aby]\$\S+/g, /[A-Za-z0-9+/_-]{40,}={0,2}/g, /\b[0-9a-f]{32,}\b/gi];

export function redact(text: string): string {
  return SECRET_PATTERNS.reduce((acc, re) => acc.replace(re, '[redacted]'), text);
}

export function describeError(error: unknown): string {
  const cause = (error as { cause?: unknown } | null)?.cause as
    { code?: string; detail?: string; message?: string } | undefined;
  const isQueryError =
    (error as { query?: unknown } | null)?.query !== undefined || (error as Error)?.name === 'DrizzleQueryError';
  let text: string;
  if (isQueryError || (cause && typeof cause === 'object' && cause.code)) {
    text = [cause?.code, cause?.detail, cause?.message].filter(Boolean).join(' ') || 'database query failed';
  } else {
    text = error instanceof Error ? error.message : String(error);
  }
  return redact(text).slice(0, 300);
}
