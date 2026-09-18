import { clientEnv } from '@/lib/env';

interface CldOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'scale';
  gravity?: 'auto' | 'face';
  resourceType?: 'image' | 'video';
}

/** f_auto + q_auto -> AVIF/WebP (or the video equivalent) where supported, sized at the edge. */
export const cldUrl = (publicId: string, opts: CldOptions = {}): string => {
  const parts = ['f_auto', 'q_auto'];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);
  if (opts.crop) parts.push(`c_${opts.crop}`);
  if (opts.gravity) parts.push(`g_${opts.gravity}`);
  const resourceType = opts.resourceType ?? 'image';
  return `https://res.cloudinary.com/${clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${parts.join(',')}/${publicId}`;
};
