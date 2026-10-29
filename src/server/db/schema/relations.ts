import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { projectGalleryImages } from './project-gallery-images';
import { quoteRequests } from './quote-requests';
import { adminUsers } from './admin-users';
import { users } from './auth';
import { contactMessages } from './contact-messages';
import { enquiryPhotos } from './enquiry-photos';
import { homepageCatalogs } from './homepage-catalogs';
import { media } from './media';
import { partnerLogos } from './partner-logos';
import { services } from './services';
import { testimonials } from './testimonials';

// Kept in a dedicated file (rather than inline in projects.ts / project-gallery-images.ts)
// to avoid a circular import between the two table modules — each relations() call needs
// both table objects fully initialized, which a cycle between the table files themselves
// cannot guarantee at module-evaluation time.
export const projectsRelations = relations(projects, ({ one, many }) => ({
  galleryImages: many(projectGalleryImages),
  beforeImageMedia: one(media, {
    fields: [projects.beforeImageMediaId],
    references: [media.id],
    relationName: 'projectBefore',
  }),
  afterImageMedia: one(media, {
    fields: [projects.afterImageMediaId],
    references: [media.id],
    relationName: 'projectAfter',
  }),
  ogImageMedia: one(media, { fields: [projects.ogImageMediaId], references: [media.id], relationName: 'projectOg' }),
}));

export const projectGalleryImagesRelations = relations(projectGalleryImages, ({ one }) => ({
  project: one(projects, {
    fields: [projectGalleryImages.projectId],
    references: [projects.id],
  }),
  media: one(media, { fields: [projectGalleryImages.mediaId], references: [media.id] }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  assignedAdmin: one(adminUsers, {
    fields: [quoteRequests.assignedAdminId],
    references: [adminUsers.id],
  }),
  assignedUser: one(users, {
    fields: [quoteRequests.assignedUserId],
    references: [users.id],
  }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  assignedQuotes: many(quoteRequests),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  iconMedia: one(media, { fields: [services.iconMediaId], references: [media.id], relationName: 'serviceIcon' }),
  imageMedia: one(media, { fields: [services.imageMediaId], references: [media.id], relationName: 'serviceImage' }),
  ogImageMedia: one(media, { fields: [services.ogImageMediaId], references: [media.id], relationName: 'serviceOg' }),
}));

export const homepageCatalogsRelations = relations(homepageCatalogs, ({ one }) => ({
  iconMedia: one(media, { fields: [homepageCatalogs.iconMediaId], references: [media.id] }),
}));

export const partnerLogosRelations = relations(partnerLogos, ({ one }) => ({
  logoMedia: one(media, { fields: [partnerLogos.logoMediaId], references: [media.id] }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  avatarMedia: one(media, { fields: [testimonials.avatarMediaId], references: [media.id] }),
}));

export const enquiryPhotosRelations = relations(enquiryPhotos, ({ one }) => ({
  media: one(media, { fields: [enquiryPhotos.mediaId], references: [media.id] }),
  quoteRequest: one(quoteRequests, { fields: [enquiryPhotos.quoteRequestId], references: [quoteRequests.id] }),
  contactMessage: one(contactMessages, {
    fields: [enquiryPhotos.contactMessageId],
    references: [contactMessages.id],
  }),
}));
