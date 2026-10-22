import type { Metadata, Viewport } from 'next';
import { geistMono, SITE_FONT_VARIABLES } from '@/lib/font';
import ProviderWrapper from '@/contexts/ProviderWrapper';
import { rootMetadata } from '@/lib/seo/metadata';
import { getSetting } from '@/server/queries/get-setting';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { formatOpeningHoursSummary } from '@/lib/content/opening-hours';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Site-wide fallback metadata — editable from the admin's SEO defaults. Every public page
// sets its own metadata through getPageMetadata and overrides these per field.
export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([siteSettingsService.getPublic(), getSetting('seo')]);
  return rootMetadata({
    appUrl: APP_URL,
    seo,
    siteName: settings.businessName,
    hoursSummary: formatOpeningHoursSummary(settings.openingHours),
    defaultOgImage: settings.ogImage,
  });
}

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
      className={`${SITE_FONT_VARIABLES} ${geistMono.variable} h-full antialiased`}
    >
      <body className='flex min-h-full flex-col font-sans'>
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}
