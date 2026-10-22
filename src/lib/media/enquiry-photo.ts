// A photo a visitor attached to an enquiry. `id` is the media row; legacy Cloudinary URLs
// that predate the media library have no row (`id: null`) and come last.
export type EnquiryPhoto = { id: string | null; url: string; width: number | null; height: number | null };
