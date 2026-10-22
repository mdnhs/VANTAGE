// The server talking to itself over loopback (the proxy's redirect resolver). Read at call time
// from process.env so it works in the proxy bundle; no secrets. On Vercel there is no loopback,
// so use the public origin (/api is outside the proxy matcher, so no recursion).
export const internalOrigin = (): string => {
  if (process.env.INTERNAL_ORIGIN) return process.env.INTERNAL_ORIGIN;
  if (process.env.VERCEL && process.env.NEXT_PUBLIC_APP_URL) return new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
};
