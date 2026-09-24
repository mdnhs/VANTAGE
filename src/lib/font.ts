import { Geist_Mono, Manrope, Inter } from 'next/font/google';

// Only the dashboard uses font-mono — skip the preload so marketing pages never download it.
export const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  preload: false,
});

export const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});
