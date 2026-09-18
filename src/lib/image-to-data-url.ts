// Turns a picked photo into a data URL small enough to send in a JSON body (serverless request
// limits are ~4.5MB). Phone photos are downscaled + re-encoded as JPEG in a canvas; if the
// browser can't decode the file (e.g. HEIC outside Safari) a small original is sent as-is and a
// large one is dropped rather than failing the whole submission.
const MAX_EDGE = 1600;
const MAX_RAW_BYTES = 1_500_000;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function imageFileToDataUrl(file: File): Promise<string | null> {
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
    return file.size <= MAX_RAW_BYTES && file.type.startsWith('image/') ? readAsDataUrl(file) : null;
  }
}
