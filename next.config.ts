import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Next.js 16 Cache Components — enables `'use cache'` / cacheTag / cacheLife.
  cacheComponents: true,
  // Prefetches one reusable App Shell per route instead of one prefetch per visible link —
  // the recommended pairing with cacheComponents for instant navigation. Requires
  // cacheComponents to be enabled.
  partialPrefetching: true,
  cacheLife: {
    // Projects/testimonials: fresher than the 'hours' preset because admins add these
    // regularly, but on-demand revalidateTag() on every mutation already guarantees
    // read-your-own-writes freshness — the 1-minute background revalidate of the built-in
    // 'minutes' preset added little beyond that and drove background regenerations (ISR
    // writes) far more often than the content actually changes.
    content: {
      stale: 300, // 5 minutes
      revalidate: 600, // 10 minutes
      expire: 3600, // 1 hour
    },
  },
  // Vercel Image Optimization stays off — Cloudinary is the optimiser now, so Next.js only
  // lays out the element. This should keep the Vercel image-optimization meter at 0.
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary/loader.ts',
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
