import { check, index, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { contactMessages } from './contact-messages';
import { media } from './media';
import { quoteRequests } from './quote-requests';

// Photos a visitor attached to a quote request or contact message. Exactly one
// parent is set; the media row has scope 'enquiry' and never shows in the library.
export const enquiryPhotos = pgTable(
  'enquiry_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quoteRequestId: uuid('quote_request_id').references(() => quoteRequests.id, { onDelete: 'cascade' }),
    contactMessageId: uuid('contact_message_id').references(() => contactMessages.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('enquiry_photos_quote_request_idx').on(t.quoteRequestId),
    index('enquiry_photos_contact_message_idx').on(t.contactMessageId),
    index('enquiry_photos_media_idx').on(t.mediaId),
    check(
      'enquiry_photos_one_parent',
      sql`(${t.quoteRequestId} is not null)::int + (${t.contactMessageId} is not null)::int = 1`,
    ),
  ],
);

export type EnquiryPhoto = typeof enquiryPhotos.$inferSelect;
