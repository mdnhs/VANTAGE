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

// Legacy Cloudinary images (id === null) can be resized at the edge; R2 images are served as stored.
export const sizedSrc = (img: PublicImage, t: string): string =>
  img.id === null ? img.src.replace('/upload/f_auto,q_auto/', `/upload/f_auto,q_auto,${t}/`) : img.src;
