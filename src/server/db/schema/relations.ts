import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { projectGalleryImages } from './project-gallery-images';

// Kept in a dedicated file (rather than inline in projects.ts / project-gallery-images.ts)
// to avoid a circular import between the two table modules — each relations() call needs
// both table objects fully initialized, which a cycle between the table files themselves
// cannot guarantee at module-evaluation time.
export const projectsRelations = relations(projects, ({ many }) => ({
  galleryImages: many(projectGalleryImages),
}));

export const projectGalleryImagesRelations = relations(projectGalleryImages, ({ one }) => ({
  project: one(projects, {
    fields: [projectGalleryImages.projectId],
    references: [projects.id],
  }),
}));
