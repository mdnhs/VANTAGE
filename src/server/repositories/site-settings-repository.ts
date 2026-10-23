import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { siteSettings } from '@/server/db/schema';

// Legacy singleton row (id always 1). Read-only now: the versioned `settings` keys are the
// source of truth, and this row only feeds the public fallback until `yarn settings:migrate`.
export const siteSettingsRepository = {
  get() {
    return db.query.siteSettings.findFirst({ where: eq(siteSettings.id, 1) });
  },
};
