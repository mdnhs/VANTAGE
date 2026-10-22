// Opt-in removal of the old Cloudinary originals under vantage/. Dry run unless --delete,
// and --delete only runs after `yarn media:migrate --verify` would pass. It removes only files
// that have a live copy in the media library; anything else is kept and counted.
//   yarn media:cloudinary-cleanup                              counts per folder (dry run)
//   yarn media:cloudinary-cleanup --delete                     deletes migrated files, batches of 100
//   yarn media:cloudinary-cleanup --delete --include-unreferenced   also deletes files nothing migrated
import { fail } from './lib/cli-env';

async function main() {
  const flags = new Set(process.argv.slice(2));
  const del = flags.has('--delete');
  const { CleanupInterrupted, CleanupRefused, cloudinaryCleanup, restAdminApi } =
    await import('@/server/lib/media/cloudinary-cleanup');
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
  }
  const print = (report: Awaited<ReturnType<typeof cloudinaryCleanup>>) => {
    for (const [folder, n] of Object.entries(report.folders))
      console.log(`${folder}: ${n.image} images, ${n.video} videos`);
    for (const [folder, n] of Object.entries(report.keptFolders)) {
      console.log(`${folder}: ${n.image + n.video} unreferenced kept`);
    }
  };
  try {
    const report = await cloudinaryCleanup({
      del,
      includeUnreferenced: flags.has('--include-unreferenced'),
      api: restAdminApi({ cloudName, apiKey, apiSecret }),
      onBatch: ({ resource, size, removed }) => console.log(`deleted ${size} ${resource}s (${removed} so far)`),
    });
    print(report);
    console.log(
      del
        ? `DELETED ${report.removed} of ${report.total} assets, ${report.kept} unreferenced kept`
        : `DRY RUN: ${report.total} assets would be deleted, ${report.kept} unreferenced would be kept`,
    );
  } catch (error) {
    if (error instanceof CleanupRefused) {
      console.error(`FAIL ${error.message}`);
      process.exit(1);
    }
    if (error instanceof CleanupInterrupted) {
      print(error.report);
      console.error(`FAIL ${error.message}; ${error.report.removed} assets were deleted before it stopped`);
      process.exit(1);
    }
    throw error;
  }
  process.exit(0);
}

main().catch(fail);
