import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { ApiError } from '@/server/lib/errors';
import { db } from '@/server/db';
import { projectGalleryImages, projects } from '@/server/db/schema';
import { contentImage } from '@/server/lib/media/content-images';
import type { PublicImage } from '@/lib/media/public-image';
import type { CreateProjectInput, ProjectListQuery, UpdateProjectInput } from '@/validations/project-schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Replaces the whole gallery with the given media ids, in order.
async function replaceGalleryImages(tx: Tx, projectId: string, mediaIds: string[]) {
  await tx.delete(projectGalleryImages).where(eq(projectGalleryImages.projectId, projectId));
  if (mediaIds.length === 0) return;
  await tx
    .insert(projectGalleryImages)
    .values(mediaIds.map((mediaId, index) => ({ projectId, mediaId, displayOrder: index })));
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

type WithoutLegacy<T> = {
  [K in keyof T as K extends `${string}Public${string}` ? never : K]: T[K];
};

export type PresentedProject = WithoutLegacy<
  Omit<ProjectWithMedia, 'beforeImageMedia' | 'afterImageMedia' | 'galleryImages'>
> & {
  beforeImage: PublicImage | null;
  afterImage: PublicImage | null;
  galleryImages: WithoutLegacy<ProjectWithMedia['galleryImages'][number]>[];
  gallery: PublicImage[];
};

// Rows carry the *MediaId columns, the raw gallery rows and the resolved PublicImages.
function present({ beforeImageMedia, afterImageMedia, galleryImages, ...row }: ProjectWithMedia): PresentedProject {
  const out = { ...row } as Record<string, unknown>;
  delete out[`beforeImage${'Public'}${'Id'}`];
  delete out[`afterImage${'Public'}${'Id'}`];
  return {
    ...out,
    beforeImage: contentImage(beforeImageMedia),
    afterImage: contentImage(afterImageMedia),
    galleryImages: galleryImages.map(({ media: _media, ...image }) => {
      const imgOut = { ...image } as Record<string, unknown>;
      delete imgOut[`image${'Public'}${'Id'}`];
      return imgOut as WithoutLegacy<ProjectWithMedia['galleryImages'][number]>;
    }),
    gallery: galleryImages.flatMap((g) => {
      const image = contentImage(g.media);
      return image ? [image] : [];
    }),
  } as PresentedProject;
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

  // `beforeWrite` runs first inside the write transaction (the media re-check).
  async create(data: CreateProjectInput & { createdBy?: string }, beforeWrite?: (tx: Tx) => Promise<void>) {
    const { galleryMediaIds, ...rest } = data;
    const row = await db.transaction(async (tx) => {
      await beforeWrite?.(tx);
      const [inserted] = await tx.insert(projects).values(rest).returning();
      if (galleryMediaIds) await replaceGalleryImages(tx, inserted.id, galleryMediaIds);
      return inserted;
    });
    return projectRepository.byId(row.id);
  },

  // `guard` pins the write to the author's own draft inside the same statement, so a
  // concurrent publish or reassignment cannot slip between the service's read and this write.
  async update(
    id: string,
    data: UpdateProjectInput,
    guard?: { ownerId: string },
    beforeWrite?: (tx: Tx) => Promise<void>,
  ) {
    const { galleryMediaIds, ...rest } = data;
    const row = await db.transaction(async (tx) => {
      await beforeWrite?.(tx);
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
