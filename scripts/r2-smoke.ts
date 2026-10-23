import Module from 'node:module';
import { loadEnvConfig } from '@next/env';
import sharp from 'sharp';

// `server-only` throws (or is absent) outside a Next bundle; stub it for this script.
const m = Module as unknown as { _load: (request: string, ...rest: unknown[]) => unknown };
const origLoad = m._load;
m._load = function (request, ...rest) {
  return request === 'server-only' ? {} : origLoad.call(this, request, ...rest);
};

// Forces the s3 driver regardless of .env.local (which keeps MEDIA_DRIVER=local in dev).
loadEnvConfig(process.cwd());
process.env.MEDIA_DRIVER = 's3';

async function main() {
  const { processUpload } = await import('@/server/lib/media/process');
  const { getStorage } = await import('@/server/lib/media/storage');

  const png = await sharp({
    create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
  const processed = await processUpload(png, 'r2-smoke.png');
  const storage = getStorage();
  if (storage.name !== 's3') throw new Error('s3 driver not active');
  await storage.put(processed.key, processed.body, processed.mimeType);

  const url = storage.urlFor(processed.key);
  let status = 0;
  let type = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    status = res.status;
    type = res.headers.get('content-type') ?? '';
    if (status === 200) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (status !== 200 || !type.startsWith('image/png')) {
    throw new Error(`public fetch status=${status} content-type=${type || 'none'}`);
  }
  console.log(`OK ${processed.key} ${status}`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`FAIL ${msg.slice(0, 300)}`);
  process.exit(1);
});
