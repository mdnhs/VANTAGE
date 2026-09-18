import type { Metadata, Viewport } from 'next';
import { geistSans, geistMono } from '@/lib/font';
import { JsonLd } from '@/components/seo/json-ld';
import ProviderWrapper from '@/contexts/ProviderWrapper';
import { cldUrl } from '@/lib/cloudinary/url';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { formatOpeningHoursSummary } from '@/features/site-settings/lib/opening-hours';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Site-wide fallback metadata — editable from the admin's Settings > SEO tab. Individual
// pages that set their own `metadata`/`generateMetadata` still override these per-field.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await siteSettingsService.getPublic();
  const title = settings.metaTitle || settings.businessName;
  const description =
    settings.metaDescription || `${settings.businessName} — ${formatOpeningHoursSummary(settings.openingHours)}`;
  const ogImage = settings.ogImagePublicId
    ? cldUrl(settings.ogImagePublicId, { width: 1200, height: 630, crop: 'fill' })
    : '/opengraph-image.png';

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: title,
      template: `%s | ${settings.businessName}`,
    },
    description,
    applicationName: settings.businessName,
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: settings.businessName,
      locale: 'en_IE',
      url: '/',
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: settings.businessName }],
    },
    twitter: {
      card: 'summary_large_image',
      site: settings.twitterHandle || undefined,
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const settings = await siteSettingsService.getPublic();

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
            name: settings.businessName,
            url: APP_URL,
          }}
        />
        <JsonLd
          schema={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': `${APP_URL}/#website`,
            url: APP_URL,
            name: settings.businessName,
            publisher: { '@id': `${APP_URL}/#organization` },
          }}
        />
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}
