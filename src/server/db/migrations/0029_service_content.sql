-- IF NOT EXISTS: dev databases that ran this change from the feature branch (as 0031) already have it.
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "content" jsonb;
