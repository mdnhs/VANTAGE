import type { NextConfig } from 'next';

const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

// The public site may be framed by itself only: the Appearance preview shows it
// inside the admin (same origin). Admin, API and sign-in pages are never framed.
const frameSelf = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
];
const frameNone = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];
// Where framing stays denied. Later rules win for the same header key (Next).
const NEVER_FRAMED = [
  '/dashboard/:path*',
  '/api/:path*',
  '/login',
  '/account/:path*',
  '/forgot-password',
  '/reset-password',
  '/two-factor',
  '/two-factor-setup',
];

// The s3 media driver's public host, read at build (Docker passes MEDIA_PUBLIC_URL as a build arg).
const mediaRemotePatterns = () => {
  const raw = process.env.MEDIA_PUBLIC_URL;
  if (!raw) return [];
  const url = new URL(raw);
  return [
    {
      protocol: url.protocol === 'http:' ? ('http' as const) : ('https' as const),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    },
  ];
};

const nextConfig: NextConfig = {
  // Self-contained server bundle for the VPS Docker image (sharp is externalized by default).
  output: 'standalone',
  poweredByHeader: false,
  // undici and sharp are imported at runtime; keep native bindings out of the Turbopack bundle.
  serverExternalPackages: ['undici', 'sharp'],
  // Next.js 16 Cache Components — enables `'use cache'` / cacheTag / cacheLife.
  cacheComponents: true,
  // The share-card font is read from disk at runtime; trace it into the standalone bundle.
  outputFileTracingIncludes: { '/og/\\[page\\]': ['./assets/fonts/*.ttf'] },
  // Media is served as stored (R2 or /uploads); Next optimises it. No localPatterns: this site serves
  // many /public paths.
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 90],
    minimumCacheTTL: 31536000,
    remotePatterns: mediaRemotePatterns(),
  },
  async headers() {
    return [
      { source: '/:path*', headers: [...baseHeaders, ...frameSelf] },
      ...NEVER_FRAMED.map((source) => ({ source, headers: frameNone })),
      // Last, so it wins: the upload route's own sandbox CSP is dropped when a config rule already
      // set the header, so the sandbox is restated here (plus the same-origin framing allowance).
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'; sandbox; frame-ancestors 'self'" }],
      },
    ];
  },
};

export default nextConfig;
