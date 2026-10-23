// The field message for a refused photo in a public form's 422 body, or null.
export function photoErrorOf(body: unknown): string | null {
  const causes = (body as { error?: { causes?: Record<string, string[]> } } | null)?.error?.causes;
  if (!causes) return null;
  for (const [path, messages] of Object.entries(causes)) {
    if (path === 'photoUrls' || path.startsWith('photoUrls.')) return messages[0] ?? null;
  }
  return null;
}
