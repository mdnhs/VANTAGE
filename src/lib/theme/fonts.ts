// Curated next/font/google catalogue. Both site font slots choose from it;
// the fonts themselves are declared at build time in src/lib/font.ts.
export const SITE_FONT_IDS = [
  'inter',
  'manrope',
  'plus-jakarta-sans',
  'montserrat',
  'dm-sans',
  'space-grotesk',
  'outfit',
  'sora',
] as const;
export type SiteFontId = (typeof SITE_FONT_IDS)[number];

export const SITE_FONTS: Record<SiteFontId, { label: string; variable: string }> = {
  inter: { label: 'Inter', variable: '--font-inter' },
  manrope: { label: 'Manrope', variable: '--font-manrope' },
  'plus-jakarta-sans': { label: 'Plus Jakarta Sans', variable: '--font-jakarta' },
  montserrat: { label: 'Montserrat', variable: '--font-montserrat' },
  'dm-sans': { label: 'DM Sans', variable: '--font-dm-sans' },
  'space-grotesk': { label: 'Space Grotesk', variable: '--font-space-grotesk' },
  outfit: { label: 'Outfit', variable: '--font-outfit' },
  sora: { label: 'Sora', variable: '--font-sora' },
};

export const DEFAULT_FONTS: { heading: SiteFontId; body: SiteFontId } = {
  heading: 'manrope',
  body: 'inter',
};
