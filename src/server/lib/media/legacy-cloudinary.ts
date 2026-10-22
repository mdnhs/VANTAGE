import 'server-only';

export type LegacyRef = { publicId: string; resourceType: 'image' | 'video' };

// URL-only Cloudinary fallback for refs not yet migrated to R2 (no SDK). The
// cloud name is read here, server-side, at call time; unset means no fallback.
export function legacyCloudinaryUrl(ref: LegacyRef): string | null {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud || !ref.publicId) return null;
  return `https://res.cloudinary.com/${cloud}/${ref.resourceType}/upload/f_auto,q_auto/${ref.publicId}`;
}
