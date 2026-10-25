import localFont from 'next/font/local';

// Fonts are self-hosted (latin variable woff2 in src/fonts) so builds never depend on reaching
// Google Fonts — a flaky connection there fails the whole build.

export const geistSans = localFont({
  src: '../fonts/geist.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const geistMono = localFont({
  src: '../fonts/geist-mono.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const manrope = localFont({
  src: '../fonts/manrope.woff2',
  variable: '--font-manrope',
  weight: '200 800',
});

export const inter = localFont({
  src: '../fonts/inter.woff2',
  variable: '--font-inter',
  weight: '100 900',
});

// Admin shell font (applied via admin.css). Not preloaded so public pages never download it.
export const jakarta = localFont({
  src: '../fonts/plus-jakarta-sans.woff2',
  variable: '--font-jakarta',
  weight: '200 800',
  preload: false,
});

// Curated alternatives for the public site's heading/body slots (Appearance > Site). Declared at
// build time so there is no runtime Google Fonts fetch; not preloaded, so a font only downloads
// when the published theme selects it. adjustFontFallback stays on (metric-matched fallback).
export const montserrat = localFont({
  src: '../fonts/montserrat.woff2',
  variable: '--font-montserrat',
  weight: '100 900',
  display: 'swap',
  preload: false,
});

export const dmSans = localFont({
  src: '../fonts/dm-sans.woff2',
  variable: '--font-dm-sans',
  weight: '100 1000',
  display: 'swap',
  preload: false,
});

export const spaceGrotesk = localFont({
  src: '../fonts/space-grotesk.woff2',
  variable: '--font-space-grotesk',
  weight: '300 700',
  display: 'swap',
  preload: false,
});

export const outfit = localFont({
  src: '../fonts/outfit.woff2',
  variable: '--font-outfit',
  weight: '100 900',
  display: 'swap',
  preload: false,
});

export const sora = localFont({
  src: '../fonts/sora.woff2',
  variable: '--font-sora',
  weight: '100 800',
  display: 'swap',
  preload: false,
});

// Every catalogue font's variable class, set on <html> so a :root override of
// --font-site-heading / --font-site-body resolves (src/lib/theme/fonts.ts lists the catalogue).
export const SITE_FONT_VARIABLES = [inter, manrope, jakarta, montserrat, dmSans, spaceGrotesk, outfit, sora]
  .map((font) => font.variable)
  .join(' ');
