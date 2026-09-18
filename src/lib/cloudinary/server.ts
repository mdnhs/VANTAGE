import { v2 as cloudinary } from 'cloudinary';
import { serverEnv } from '@/lib/env';
import { clientEnv } from '@/lib/env';

cloudinary.config({
  cloud_name: clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: serverEnv().CLOUDINARY_API_KEY,
  api_secret: serverEnv().CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const destroyAsset = (publicId: string) => cloudinary.uploader.destroy(publicId);
