// next/image passes src/width/quality here; we return a Cloudinary URL and skip Vercel's
// image optimiser entirely — Cloudinary already resizes and re-encodes.
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Local /public assets aren't on Cloudinary — pass them through unchanged. Same for a src
  // that's already a full Cloudinary URL (built by cldUrl() with its own explicit
  // width/height/crop/gravity) — re-wrapping it here would nest a second transform URL
  // inside the first and break the image entirely.
  if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://')) return src;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const transforms = ['f_auto', `q_${quality ?? 'auto'}`, `w_${width}`, 'c_limit'];
  const publicId = src.replace(/^\//, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${publicId}`;
}
