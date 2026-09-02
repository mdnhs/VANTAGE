import type { Metadata, Viewport } from 'next';
import { geistSans, geistMono } from '@/lib/font';
import { JsonLd } from '@/components/seo/json-ld';
import ProviderWrapper from '@/contexts/ProviderWrapper';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const APP_NAME = 'Vantage';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Enterprise Next.js starter`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Vantage is a cost-optimized, EU-first Next.js enterprise application.',
  applicationName: APP_NAME,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    locale: 'en_IE',
    url: '/',
    title: `${APP_NAME} — Enterprise Next.js starter`,
    description: 'Vantage is a cost-optimized, EU-first Next.js enterprise application.',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Enterprise Next.js starter`,
    description: 'Vantage is a cost-optimized, EU-first Next.js enterprise application.',
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className='flex min-h-full flex-col'>
        <JsonLd
          schema={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': `${APP_URL}/#organization`,
            name: APP_NAME,
            url: APP_URL,
          }}
        />
        <JsonLd
          schema={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${APP_URL}/#website`,
            url: APP_URL,
            name: APP_NAME,
            publisher: { '@id': `${APP_URL}/#organization` },
          }}
        />
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}
