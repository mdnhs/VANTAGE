import { Geist, Geist_Mono, Manrope, Inter, Plus_Jakarta_Sans } from 'next/font/google';

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
