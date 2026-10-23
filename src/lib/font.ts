import {
  DM_Sans,
  Geist,
  Geist_Mono,
  Inter,
  Manrope,
  Montserrat,
  Outfit,
  Plus_Jakarta_Sans,
  Sora,
  Space_Grotesk,
} from 'next/font/google';

export const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Admin shell font (applied via admin.css). Not preloaded so public pages never download it.
export const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  preload: false,
});

// Curated alternatives for the public site's heading/body slots (Appearance > Site). Declared at
// build time so there is no runtime Google Fonts fetch; not preloaded, so a font only downloads
// when the published theme selects it. adjustFontFallback stays on (metric-matched fallback).
export const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

// Every catalogue font's variable class, set on <html> so a :root override of
// --font-site-heading / --font-site-body resolves (src/lib/theme/fonts.ts lists the catalogue).
export const SITE_FONT_VARIABLES = [inter, manrope, jakarta, montserrat, dmSans, spaceGrotesk, outfit, sora]
  .map((font) => font.variable)
  .join(' ');
