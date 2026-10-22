import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { projectGalleryImages, projects } from '@/server/db/schema';
import type { CreateProjectInput, ProjectListQuery, UpdateProjectInput } from '@/validations/project-schema';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Runs inside the caller's transaction so the project row and its gallery rows commit atomically.
async function replaceGalleryImages(tx: Tx, projectId: string, publicIds: string[]) {
  await tx.delete(projectGalleryImages).where(eq(projectGalleryImages.projectId, projectId));
  if (publicIds.length === 0) return;
  await tx.insert(projectGalleryImages).values(
    publicIds.map((imagePublicId, index) => ({
      projectId,
      imagePublicId,
      displayOrder: index,
    })),
  );
}

export const projectRepository = {
  // Admin list: every row (draft + published), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine, mirrors services.
  async list({ page, limit }: Pick<ProjectListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.projects.findMany({
        with: { galleryImages: { orderBy: (t, { asc }) => [asc(t.displayOrder)] } },
        orderBy: [asc(projects.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(projects),
    ]);
    return { rows, total: count };
  },

  // Public list: published only, in display order. Dataset is small (a portfolio page, not
  // a paginated catalog) so a plain `limit` is enough — no cursor plumbing needed.
  async listPublished(params: { limit?: number } = {}) {
    return db.query.projects.findMany({
      where: eq(projects.status, 'published'),
      with: { galleryImages: { orderBy: (t, { asc }) => [asc(t.displayOrder)] } },
      orderBy: [asc(projects.displayOrder)],
      limit: params.limit,
    });
  },

  async listFeatured() {
    return db.query.projects.findMany({
      where: and(eq(projects.isFeatured, true), eq(projects.status, 'published')),
      with: { galleryImages: { orderBy: (t, { asc }) => [asc(t.displayOrder)] } },
      orderBy: [asc(projects.displayOrder)],
    });
  },

  async byId(id: string) {
    return db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: { galleryImages: { orderBy: (t, { asc }) => [asc(t.displayOrder)] } },
    });
  },

  async bySlug(slug: string) {
    return db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: { galleryImages: { orderBy: (t, { asc }) => [asc(t.displayOrder)] } },
    });
  },

  async create(data: CreateProjectInput) {
    const { galleryImagePublicIds, ...rest } = data;
    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(projects).values(rest).returning();
      if (galleryImagePublicIds && galleryImagePublicIds.length > 0) {
        await replaceGalleryImages(tx, inserted.id, galleryImagePublicIds);
      }
      return inserted;
    });
    return projectRepository.byId(row.id);
  },

  async update(id: string, data: UpdateProjectInput) {
    const { galleryImagePublicIds, ...rest } = data;
    const row = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(projects)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      if (updated && galleryImagePublicIds !== undefined) {
        await replaceGalleryImages(tx, id, galleryImagePublicIds);
      }
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
