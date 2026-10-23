// What a public page needs to draw one image. Client-safe: no server imports.
export type PublicImage = {
  id: string | null;
  src: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  alt: string;
  blurDataUrl: string | null;
  focal: { x: number; y: number };
};

// Images are served as stored; Next.js handles responsive sizing.
export const sizedSrc = (img: PublicImage, _t?: string): string => img.src;
