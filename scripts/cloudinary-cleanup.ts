// Opt-in removal of the old Cloudinary originals under vantage/. Dry run unless --delete,
// and --delete only runs after `yarn media:migrate --verify` would pass.
//   yarn media:cloudinary-cleanup            counts per folder
//   yarn media:cloudinary-cleanup --delete   deletes in batches of 100
import { fail } from './lib/cli-env';

async function main() {
  const del = process.argv.slice(2).includes('--delete');
  const { CleanupRefused, cloudinaryCleanup, restAdminApi } = await import('@/server/lib/media/cloudinary-cleanup');
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
  }
  try {
    const report = await cloudinaryCleanup({ del, api: restAdminApi({ cloudName, apiKey, apiSecret }) });
    for (const [folder, n] of Object.entries(report.folders))
      console.log(`${folder}: ${n.image} images, ${n.video} videos`);
    console.log(
      del ? `DELETED ${report.removed} of ${report.total} assets` : `DRY RUN: ${report.total} assets would be deleted`,
    );
  } catch (error) {
    if (error instanceof CleanupRefused) {
      console.error(`FAIL ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
  process.exit(0);
}

main().catch(fail);
