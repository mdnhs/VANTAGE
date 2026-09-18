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
