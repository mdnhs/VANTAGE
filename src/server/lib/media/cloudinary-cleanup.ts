import 'server-only';

import { verifyCloudinaryMigration } from './cloudinary-migration';

export const CLEANUP_PREFIX = 'vantage/';
export const DELETE_BATCH = 100;

export class CleanupRefused extends Error {}

type Resource = 'image' | 'video';
export type CloudinaryAdminApi = {
  list(resource: Resource, prefix: string, cursor?: string): Promise<{ ids: string[]; next?: string }>;
  remove(resource: Resource, ids: string[]): Promise<void>;
};

export type CleanupReport = {
  deleted: boolean;
  // Assets under the prefix, per folder, per resource type.
  folders: Record<string, { image: number; video: number }>;
  total: number;
  removed: number;
};

// Cloudinary Admin REST API over fetch with basic auth: no SDK.
export function restAdminApi(env: { cloudName: string; apiKey: string; apiSecret: string }): CloudinaryAdminApi {
  const base = `https://api.cloudinary.com/v1_1/${env.cloudName}`;
  const headers = { Authorization: `Basic ${Buffer.from(`${env.apiKey}:${env.apiSecret}`).toString('base64')}` };
  return {
    async list(resource, prefix, cursor) {
      const query = new URLSearchParams({ prefix, max_results: '500', type: 'upload' });
      if (cursor) query.set('next_cursor', cursor);
      const res = await fetch(`${base}/resources/${resource}/upload?${query.toString()}`, { headers });
      if (!res.ok) throw new Error(`Cloudinary list failed (HTTP ${res.status})`);
      const body = (await res.json()) as { resources: { public_id: string }[]; next_cursor?: string };
      return { ids: body.resources.map((r) => r.public_id), next: body.next_cursor };
    },
    async remove(resource, ids) {
      const query = new URLSearchParams();
      for (const id of ids) query.append('public_ids[]', id);
      const res = await fetch(`${base}/resources/${resource}/upload?${query.toString()}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Cloudinary delete failed (HTTP ${res.status})`);
    },
  };
}

// Dry run by default. Deleting needs `del`, and only happens after the migration verifies;
// it never touches anything outside the `vantage/` prefix.
export async function cloudinaryCleanup(opts: {
  del: boolean;
  api: CloudinaryAdminApi;
  verify?: () => Promise<{ ok: boolean; problems: string[] }>;
}): Promise<CleanupReport> {
  const verify = opts.verify ?? verifyCloudinaryMigration;
  if (opts.del) {
    const result = await verify();
    if (!result.ok) {
      throw new CleanupRefused(`Refusing to delete: ${result.problems.length} problems from media:migrate --verify`);
    }
  }
  const report: CleanupReport = { deleted: opts.del, folders: {}, total: 0, removed: 0 };
  for (const resource of ['image', 'video'] as const) {
    const ids: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await opts.api.list(resource, CLEANUP_PREFIX, cursor);
      ids.push(...page.ids.filter((id) => id.startsWith(CLEANUP_PREFIX)));
      cursor = page.next;
    } while (cursor);
    for (const id of ids) {
      const folder = id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : CLEANUP_PREFIX;
      (report.folders[folder] ??= { image: 0, video: 0 })[resource] += 1;
    }
    report.total += ids.length;
    if (!opts.del) continue;
    for (let i = 0; i < ids.length; i += DELETE_BATCH) {
      const batch = ids.slice(i, i + DELETE_BATCH);
      await opts.api.remove(resource, batch);
      report.removed += batch.length;
    }
  }
  return report;
}
