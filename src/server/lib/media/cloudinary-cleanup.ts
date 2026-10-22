import 'server-only';

import { and, isNotNull, isNull, like } from 'drizzle-orm';

import { db } from '@/server/db';
import { media } from '@/server/db/schema/media';

import { verifyCloudinaryMigration } from './cloudinary-migration';

export const CLEANUP_PREFIX = 'vantage/';
export const DELETE_BATCH = 100;
const RETRIES = 2;

export class CleanupRefused extends Error {}

// A failure part-way through still reports how much was removed before it.
export class CleanupInterrupted extends Error {
  constructor(
    message: string,
    readonly report: CleanupReport,
  ) {
    super(message);
  }
}

type Resource = 'image' | 'video';
export type CloudinaryAdminApi = {
  list(resource: Resource, prefix: string, cursor?: string): Promise<{ ids: string[]; next?: string }>;
  remove(resource: Resource, ids: string[]): Promise<void>;
};

type FolderCounts = Record<string, { image: number; video: number }>;

export type CleanupReport = {
  deleted: boolean;
  // Assets under the prefix that are in scope (migrated ones, or all with includeUnreferenced).
  folders: FolderCounts;
  // Assets with no live media copy, per folder: kept unless includeUnreferenced.
  keptFolders: FolderCounts;
  total: number;
  kept: number;
  removed: number;
};

const retryable = (status: number) => status === 420 || status === 429 || status >= 500;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// fetch with up to 2 retries (backoff 1 s, 2 s) on rate limits and server errors.
async function fetchRetrying(url: string, init: RequestInit, sleep: (ms: number) => Promise<unknown>) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.ok || !retryable(res.status) || attempt >= RETRIES) return res;
    await sleep(1000 * 2 ** attempt);
  }
}

// Cloudinary Admin REST API over fetch with basic auth: no SDK.
export function restAdminApi(
  env: { cloudName: string; apiKey: string; apiSecret: string },
  sleep: (ms: number) => Promise<unknown> = pause,
): CloudinaryAdminApi {
  const base = `https://api.cloudinary.com/v1_1/${env.cloudName}`;
  const headers = { Authorization: `Basic ${Buffer.from(`${env.apiKey}:${env.apiSecret}`).toString('base64')}` };
  return {
    async list(resource, prefix, cursor) {
      const query = new URLSearchParams({ prefix, max_results: '500', type: 'upload' });
      if (cursor) query.set('next_cursor', cursor);
      const res = await fetchRetrying(`${base}/resources/${resource}/upload?${query.toString()}`, { headers }, sleep);
      if (!res.ok) throw new Error(`Cloudinary list failed (HTTP ${res.status})`);
      const body = (await res.json()) as { resources: { public_id: string }[]; next_cursor?: string };
      return { ids: body.resources.map((r) => r.public_id), next: body.next_cursor };
    },
    async remove(resource, ids) {
      const query = new URLSearchParams();
      for (const id of ids) query.append('public_ids[]', id);
      const res = await fetchRetrying(
        `${base}/resources/${resource}/upload?${query.toString()}`,
        { method: 'DELETE', headers },
        sleep,
      );
      if (!res.ok) throw new Error(`Cloudinary delete failed (HTTP ${res.status})`);
    },
  };
}

// The Cloudinary files that have a live copy in the media library (legacy_source set).
export async function migratedSources(): Promise<Set<string>> {
  const rows = await db
    .select({ source: media.legacySource })
    .from(media)
    .where(and(isNull(media.deletedAt), isNotNull(media.legacySource), like(media.legacySource, 'cloudinary:%')));
  return new Set(rows.flatMap((r) => (r.source ? [r.source] : [])));
}

// Dry run by default. Deleting needs `del`, and only happens after the migration verifies. It
// removes only assets that have a live media copy, never anything outside the `vantage/` prefix,
// unless `includeUnreferenced` is set on purpose.
export async function cloudinaryCleanup(opts: {
  del: boolean;
  api: CloudinaryAdminApi;
  includeUnreferenced?: boolean;
  verify?: () => Promise<{ ok: boolean; problems: string[] }>;
  sources?: () => Promise<Set<string>>;
  onBatch?: (info: { resource: Resource; size: number; removed: number; total: number }) => void;
}): Promise<CleanupReport> {
  const verify = opts.verify ?? verifyCloudinaryMigration;
  if (opts.del) {
    const result = await verify();
    if (!result.ok) {
      throw new CleanupRefused(`Refusing to delete: ${result.problems.length} problems from media:migrate --verify`);
    }
  }
  const sources = await (opts.sources ?? migratedSources)();
  const report: CleanupReport = { deleted: opts.del, folders: {}, keptFolders: {}, total: 0, kept: 0, removed: 0 };
  const tally = (into: FolderCounts, resource: Resource, id: string) => {
    const folder = id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : CLEANUP_PREFIX;
    (into[folder] ??= { image: 0, video: 0 })[resource] += 1;
  };

  try {
    for (const resource of ['image', 'video'] as const) {
      const listed: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await opts.api.list(resource, CLEANUP_PREFIX, cursor);
        listed.push(...page.ids.filter((id) => id.startsWith(CLEANUP_PREFIX)));
        cursor = page.next;
      } while (cursor);

      const ids: string[] = [];
      for (const id of listed) {
        if (opts.includeUnreferenced || sources.has(`cloudinary:${resource}:${id}`)) {
          ids.push(id);
          tally(report.folders, resource, id);
        } else {
          report.kept += 1;
          tally(report.keptFolders, resource, id);
        }
      }
      report.total += ids.length;
      if (!opts.del) continue;
      for (let i = 0; i < ids.length; i += DELETE_BATCH) {
        const batch = ids.slice(i, i + DELETE_BATCH);
        await opts.api.remove(resource, batch);
        report.removed += batch.length;
        opts.onBatch?.({ resource, size: batch.length, removed: report.removed, total: report.total });
      }
    }
  } catch (error) {
    throw new CleanupInterrupted(error instanceof Error ? error.message : 'cleanup failed', report);
  }
  return report;
}
