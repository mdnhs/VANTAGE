import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { siteSettings } from '@/server/db/schema';
import type { UpdateSiteSettingsInput } from '@/validations/site-settings-schema';

// Singleton row (id always 1). No pagination, no list — one lookup, one upsert.
export const siteSettingsRepository = {
  get() {
    return db.query.siteSettings.findFirst({ where: eq(siteSettings.id, 1) });
  },

  async upsert(data: UpdateSiteSettingsInput) {
    const [row] = await db
      .insert(siteSettings)
      .values({ id: 1, ...data } as typeof siteSettings.$inferInsert)
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row;
  },
};
