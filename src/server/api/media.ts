import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@/server/lib/validator';
import { requireAuth, type AuthEnv } from '@/server/middleware/auth';
import { rateLimit } from '@/server/middleware/rate-limit';
import { ok } from '@/server/lib/response';
import { serverEnv, clientEnv } from '@/lib/env';
import { cloudinary, destroyAsset } from '@/lib/cloudinary/server';

const signSchema = z.object({ folder: z.string().min(1).max(64) });

// Browser uploads straight to Cloudinary — this route only signs the request, so no file
// bytes ever pass through a Vercel function (cost and duration stay at zero either way).
export const media = new Hono<AuthEnv>()
  .use('*', requireAuth)

  .post('/sign', rateLimit(30, 60_000), zValidator('json', signSchema), (c) => {
    const { folder } = c.req.valid('json');
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, serverEnv().CLOUDINARY_API_SECRET!);

    return ok(c, {
      signature,
      timestamp,
      folder,
      apiKey: serverEnv().CLOUDINARY_API_KEY,
      cloudName: clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  })

  .delete('/:publicId{.+}', async (c) => {
    await destroyAsset(c.req.param('publicId'));
    return ok(c, null);
  });
