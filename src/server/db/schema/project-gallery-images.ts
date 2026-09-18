import { index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const projectGalleryImages = pgTable(
  'project_gallery_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    imagePublicId: varchar('image_public_id', { length: 255 }).notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('project_gallery_images_project_id_idx').on(table.projectId)],
);

export type ProjectGalleryImage = typeof projectGalleryImages.$inferSelect;
export type NewProjectGalleryImage = typeof projectGalleryImages.$inferInsert;
