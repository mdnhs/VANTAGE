import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { siteSettings } from '@/server/db/schema';
import type { UpdateSiteSettingsInput } from '@/validations/site-settings-schema';

// Singleton row (id always 1). No pagination, no list — one lookup, one upsert.
export const siteSettingsRepository = {
  get() {
    return db.query.siteSettings.findFirst({ where: eq(siteSettings.id, 1) });
  },

  // Settings is edited section-by-section, so any single call may carry only a few
  // columns — e.g. the Social links tab never touches businessName/phone/email/address/
  // openingHours. Those five are NOT NULL, so the *first-ever* save (row doesn't exist yet)
  // needs a placeholder for whichever of them this section didn't send, or the insert
  // violates the constraint. `onConflictDoUpdate`'s `set` only ever contains `data`, so an
  // existing row's other columns are never touched by these placeholders.
  async upsert(data: UpdateSiteSettingsInput) {
    const [row] = await db
      .insert(siteSettings)
      .values({
        id: 1,
        businessName: '',
        phone: '',
        email: '',
        address: '',
        openingHours: '',
        ...data,
      } as typeof siteSettings.$inferInsert)
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row;
  },
};
