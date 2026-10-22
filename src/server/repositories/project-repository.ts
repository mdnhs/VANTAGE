import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { ApiError } from '@/server/lib/errors';
import { db } from '@/server/db';
import { projectGalleryImages, projects } from '@/server/db/schema';
import { contentImage } from '@/server/lib/media/content-images';
import type { CreateProjectInput, ProjectListQuery, UpdateProjectInput } from '@/validations/project-schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Replaces the whole gallery (legacy rows included) with the given media ids, in order.
async function replaceGalleryImages(tx: Tx, projectId: string, mediaIds: string[]) {
  await tx.delete(projectGalleryImages).where(eq(projectGalleryImages.projectId, projectId));
  if (mediaIds.length === 0) return;
  await tx
    .insert(projectGalleryImages)
    .values(mediaIds.map((mediaId, index) => ({ projectId, mediaId, imagePublicId: null, displayOrder: index })));
}

const withMedia = {
  beforeImageMedia: true as const,
  afterImageMedia: true as const,
  galleryImages: { orderBy: [asc(projectGalleryImages.displayOrder)], with: { media: true as const } },
};

function findOne(id: string) {
  return db.query.projects.findFirst({ where: eq(projects.id, id), with: withMedia });
}

type ProjectWithMedia = NonNullable<Awaited<ReturnType<typeof findOne>>>;

// Rows carry the *MediaId columns, the raw gallery rows and the resolved PublicImages
// (gallery entries with neither a live media row nor a legacy id are dropped).
function present({ beforeImageMedia, afterImageMedia, galleryImages, ...row }: ProjectWithMedia) {
  return {
    ...row,
    beforeImage: contentImage(beforeImageMedia, row.beforeImagePublicId),
    afterImage: contentImage(afterImageMedia, row.afterImagePublicId),
    galleryImages: galleryImages.map(({ media: _media, ...image }) => image),
    gallery: galleryImages.flatMap((g) => {
      const image = contentImage(g.media, g.imagePublicId);
      return image ? [image] : [];
    }),
  };
}

export const projectRepository = {
  // Admin list: every row (draft + published), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine, mirrors services.
  async list({ page, limit }: Pick<ProjectListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.projects.findMany({
        with: withMedia,
        orderBy: [asc(projects.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(projects),
    ]);
    return { rows: rows.map(present), total: count };
  },

  // Public list: published only, in display order. Dataset is small (a portfolio page, not
  // a paginated catalog) so a plain `limit` is enough — no cursor plumbing needed.
  async listPublished(params: { limit?: number } = {}) {
    const rows = await db.query.projects.findMany({
      where: eq(projects.status, 'published'),
      with: withMedia,
      orderBy: [asc(projects.displayOrder)],
      limit: params.limit,
    });
    return rows.map(present);
  },

  async listFeatured() {
    const rows = await db.query.projects.findMany({
      where: and(eq(projects.isFeatured, true), eq(projects.status, 'published')),
      with: withMedia,
      orderBy: [asc(projects.displayOrder)],
    });
    return rows.map(present);
  },

  async byId(id: string) {
    const row = await findOne(id);
    return row ? present(row) : undefined;
  },

  async bySlug(slug: string) {
    const row = await db.query.projects.findFirst({ where: eq(projects.slug, slug), with: withMedia });
    return row ? present(row) : undefined;
  },

  async create(data: CreateProjectInput & { createdBy?: string }) {
    const { galleryMediaIds, ...rest } = data;
    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(projects).values(rest).returning();
      if (galleryMediaIds) await replaceGalleryImages(tx, inserted.id, galleryMediaIds);
      return inserted;
    });
    return projectRepository.byId(row.id);
  },

  // `guard` pins the write to the author's own draft inside the same statement, so a
  // concurrent publish or reassignment cannot slip between the service's read and this write.
  async update(id: string, data: UpdateProjectInput, guard?: { ownerId: string }) {
    const { galleryMediaIds, ...rest } = data;
    const row = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(projects)
        .set({ ...rest, updatedAt: new Date() })
        .where(
          guard
            ? and(eq(projects.id, id), eq(projects.createdBy, guard.ownerId), eq(projects.status, 'draft'))
            : eq(projects.id, id),
        )
        .returning();
      if (!updated && guard) throw ApiError.forbidden('Authors can only add and edit their own draft projects.');
      if (updated && galleryMediaIds !== undefined) await replaceGalleryImages(tx, id, galleryMediaIds);
      return updated;
    });
    if (!row) return undefined;
    return projectRepository.byId(id);
  },

  // Gallery rows still on the old storage (no media id). Counted from the raw rows, not
  // from the resolved gallery, so a row whose legacy image no longer resolves still counts.
  async legacyGalleryCount(id: string) {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(projectGalleryImages)
      .where(and(eq(projectGalleryImages.projectId, id), isNull(projectGalleryImages.mediaId)));
    return row?.n ?? 0;
  },

  async remove(id: string) {
    // Gallery rows cascade via the FK's onDelete: 'cascade'.
    await db.delete(projects).where(eq(projects.id, id));
  },

  async updateStatus(id: string, status: 'draft' | 'published') {
    const [row] = await db
      .update(projects)
      .set({ status, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return row;
  },

  // One bulk UPDATE via a CASE WHEN expression — never a loop of per-row awaits.
  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(projects)
      .set({
        displayOrder: sql`(CASE ${projects.id} ${caseChunks} END)::integer`,
        updatedAt: new Date(),
      })
      .where(inArray(projects.id, ids));
  },
};
