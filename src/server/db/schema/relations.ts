import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { projectGalleryImages } from './project-gallery-images';
import { quoteRequests } from './quote-requests';
import { adminUsers } from './admin-users';

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

export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  assignedAdmin: one(adminUsers, {
    fields: [quoteRequests.assignedAdminId],
    references: [adminUsers.id],
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  assignedQuotes: many(quoteRequests),
}));
