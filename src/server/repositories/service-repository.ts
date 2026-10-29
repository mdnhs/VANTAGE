import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db, type DbLike } from '@/server/db';
import { services } from '@/server/db/schema';
import { contentImage } from '@/server/lib/media/content-images';
import type { CreateServiceInput, ServiceListQuery, UpdateServiceInput } from '@/validations/service-schema';

const withMedia = { iconMedia: true, imageMedia: true, ogImageMedia: true } as const;

type ServiceWithMedia = NonNullable<Awaited<ReturnType<typeof findOne>>>;

function findOne(id: string) {
  return db.query.services.findFirst({ where: eq(services.id, id), with: withMedia });
}

// Rows carry both the *MediaId columns and the resolved PublicImage.
function present({ iconMedia, imageMedia, ogImageMedia, ...row }: ServiceWithMedia) {
  const out = { ...row } as Record<string, unknown>;
  delete out[`icon${'Public'}${'Id'}`];
  delete out[`image${'Public'}${'Id'}`];
  return {
    ...out,
    icon: contentImage(iconMedia),
    image: contentImage(imageMedia),
    ogImage: contentImage(ogImageMedia),
  } as Omit<ServiceWithMedia, 'iconMedia' | 'imageMedia' | 'ogImageMedia'> & {
    icon: ReturnType<typeof contentImage>;
    image: ReturnType<typeof contentImage>;
    ogImage: ReturnType<typeof contentImage>;
  };
}

export const serviceRepository = {
  // Admin list: every row (enabled + disabled), ordered for the reorder UI, with a total
  // count for pagination. Small admin table — offset pagination is fine (see
  // .claude/skills/backend-resource/references/cost-optimization.md exception for small
  // admin screens; cursor pagination is not required here).
  async list({ page, limit }: Pick<ServiceListQuery, 'page' | 'limit'>) {
    const offset = (page - 1) * limit;
    const [rows, [{ count }]] = await Promise.all([
      db.query.services.findMany({
        with: withMedia,
        orderBy: [asc(services.displayOrder)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(services),
    ]);
    return { rows: rows.map(present), total: count };
  },

  // Public list: small dataset, no pagination — every enabled service, in display order.
  async listPublished() {
    const rows = await db.query.services.findMany({
      where: eq(services.isEnabled, true),
      with: withMedia,
      orderBy: [asc(services.displayOrder)],
    });
    return rows.map(present);
  },

  async byId(id: string) {
    const row = await findOne(id);
    return row ? present(row) : undefined;
  },

  async bySlug(slug: string) {
    const row = await db.query.services.findFirst({ where: eq(services.slug, slug), with: withMedia });
    return row ? present(row) : undefined;
  },

  // The public /services/<slug> page: a disabled service is not found.
  async publishedBySlug(slug: string) {
    const row = await db.query.services.findFirst({
      where: and(eq(services.slug, slug), eq(services.isEnabled, true)),
      with: withMedia,
    });
    return row ? present(row) : undefined;
  },

  // Write-only halves of create/update: the caller's transaction re-checks media first.
  async insert(data: CreateServiceInput, dbLike: DbLike = db) {
    const [row] = await dbLike.insert(services).values(data).returning({ id: services.id });
    return row.id;
  },

  async patch(id: string, data: UpdateServiceInput, dbLike: DbLike = db) {
    const [row] = await dbLike
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning({ id: services.id });
    return row?.id;
  },

  async create(data: CreateServiceInput) {
    return serviceRepository.byId(await serviceRepository.insert(data));
  },

  async update(id: string, data: UpdateServiceInput) {
    return (await serviceRepository.patch(id, data)) ? serviceRepository.byId(id) : undefined;
  },

  async remove(id: string) {
    await db.delete(services).where(eq(services.id, id));
  },

  // One bulk UPDATE via a CASE WHEN expression — never a loop of per-row awaits. `ids[0]`
  // gets displayOrder 0, `ids[1]` gets 1, etc.
  async reorder(ids: string[]) {
    const caseChunks = sql.join(
      ids.map((id, index) => sql`WHEN ${id} THEN ${index}`),
      sql` `,
    );
    await db
      .update(services)
      .set({
        displayOrder: sql`(CASE ${services.id} ${caseChunks} END)::integer`,
        updatedAt: new Date(),
      })
      .where(inArray(services.id, ids));
  },
};
