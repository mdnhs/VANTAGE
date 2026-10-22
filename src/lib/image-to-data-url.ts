// Turns a picked photo into a data URL small enough to send in a JSON body (serverless request
// limits are ~4.5MB). Phone photos are downscaled + re-encoded as JPEG in a canvas; if the
// browser can't decode the file (e.g. HEIC outside Safari) a small JPG/PNG/WebP/AVIF original is
// sent as-is; anything else is refused with a message, never dropped silently.
const MAX_EDGE = 1600;
const MAX_RAW_BYTES = 1_500_000;
const RAW_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export const PHOTO_UNREADABLE =
  'We could not read that photo. Please attach a JPG, PNG, WebP or AVIF image under 1.5 MB.';

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function imageFileToDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    if (file.size <= MAX_RAW_BYTES && RAW_TYPES.includes(file.type)) return readAsDataUrl(file);
    throw new Error(PHOTO_UNREADABLE);
  }
}
