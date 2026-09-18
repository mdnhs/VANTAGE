import { cloudinary } from '@/lib/cloudinary/server';

// Public forms send photos as data URLs (no signed-upload round trip for anonymous visitors).
// Push each one to Cloudinary and keep only the resulting URL; anything already a URL passes
// through, and an individual failed upload is skipped rather than failing the whole enquiry.
export async function uploadInquiryPhotos(photoUrls: string[] | undefined, folder: string): Promise<string[]> {
  if (!photoUrls || photoUrls.length === 0) return [];

  const results = await Promise.all(
    photoUrls.map(async (item) => {
      if (!item.startsWith('data:image/')) return item;
      try {
        const res = await cloudinary.uploader.upload(item, { folder, resource_type: 'image' });
        return res.secure_url;
      } catch {
        return null;
      }
    }),
  );

  return results.filter((url): url is string => Boolean(url));
}
