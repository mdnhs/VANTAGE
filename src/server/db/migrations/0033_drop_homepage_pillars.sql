-- Pillars were dropped from the homepage in the Figma rebuild; the admin and API went with them.
-- No CASCADE: nothing references this table, and if something ever did this should fail loudly.
DROP TABLE IF EXISTS "homepage_pillars";
