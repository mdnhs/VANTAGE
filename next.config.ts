import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
  // Next.js 16 Cache Components — enables `'use cache'` / cacheTag / cacheLife.
  cacheComponents: true,
  // Vercel Image Optimization stays off — Cloudinary is the optimiser now, so Next.js only
  // lays out the element. This should keep the Vercel image-optimization meter at 0.
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary/loader.ts',
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }, ...mediaRemotePatterns()],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
