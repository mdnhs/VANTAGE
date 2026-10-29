// The business name set in the admin (Site settings); blank falls back to the site's own domain,
// so no brand is ever baked into the code.
export function siteNameFrom(name: string | null | undefined, appUrl = process.env.NEXT_PUBLIC_APP_URL): string {
  const own = name?.trim();
  if (own) return own;
  try {
    return new URL(appUrl ?? '').hostname.replace(/^www\./, '');
  } catch {
    return 'Website';
  }
}
