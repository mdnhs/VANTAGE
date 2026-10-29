-- The footer's old default legal links pointed at #privacy / #terms, which never existed; legal
-- pages are now real pages listed automatically. Drop only those two placeholders, in both the
-- published value and the draft, and leave every other link as the admin saved it.
UPDATE "settings"
SET "value" = jsonb_set(
  "value",
  '{legalLinks}',
  (
    SELECT coalesce(jsonb_agg(link ORDER BY position), '[]'::jsonb)
    FROM jsonb_array_elements("value" -> 'legalLinks') WITH ORDINALITY AS t(link, position)
    WHERE link ->> 'href' NOT IN ('#privacy', '#terms')
  )
)
WHERE "key" = 'footer' AND jsonb_typeof("value" -> 'legalLinks') = 'array';
--> statement-breakpoint
UPDATE "settings"
SET "draft" = jsonb_set(
  "draft",
  '{legalLinks}',
  (
    SELECT coalesce(jsonb_agg(link ORDER BY position), '[]'::jsonb)
    FROM jsonb_array_elements("draft" -> 'legalLinks') WITH ORDINALITY AS t(link, position)
    WHERE link ->> 'href' NOT IN ('#privacy', '#terms')
  )
)
WHERE "key" = 'footer' AND jsonb_typeof("draft" -> 'legalLinks') = 'array';
