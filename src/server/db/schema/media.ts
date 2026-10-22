import { boolean, index, integer, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Every uploaded file the site can show. Keys are content-hashed and immutable.
export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    driver: text('driver', { enum: ['local', 's3'] }).notNull(),
    key: text('key').notNull().unique(),
    // 'enquiry' rows are anonymous public-form photos: never listed in the library.
    scope: text('scope', { enum: ['library', 'enquiry'] })
      .notNull()
      .default('library'),
    // Idempotency key of the Cloudinary migration, e.g. cloudinary:image:vantage/projects/abc.
    legacySource: text('legacy_source').unique(),
    url: text('url').notNull(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    width: integer('width'),
    height: integer('height'),
    blurDataUrl: text('blur_data_url'),
    dominantColor: text('dominant_color'),
    alt: text('alt').notNull().default(''),
    caption: text('caption'),
    focalX: real('focal_x').notNull().default(0.5),
    focalY: real('focal_y').notNull().default(0.5),
    isDecorative: boolean('is_decorative').notNull().default(false),
    needsAlt: boolean('needs_alt').notNull().default(false),
    // Attribution only; no FK (Phase 2 adds it once admins move to users).
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('media_created_at_idx').on(t.createdAt.desc()),
    index('media_mime_type_idx').on(t.mimeType),
    index('media_scope_idx').on(t.scope),
  ],
);

export type MediaRow = typeof media.$inferSelect;
