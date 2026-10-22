import type { EnquiryPhoto } from '@/lib/media/enquiry-photo';
import type { ContactMessage as DbContactMessage, NewContactMessage } from '@/server/db/schema';
import {
  CONTACT_STATUSES,
  type CreateContactMessageInput,
  type PublicContactMessageInput,
  type ContactMessageListQuery,
  type ContactStatus,
  type UpdateContactMessageInput,
} from '@/validations/contact-message-schema';

export { CONTACT_STATUSES };

export type ContactMessage = Omit<DbContactMessage, 'photoUrls'> & { photos: EnquiryPhoto[] };

export type {
  DbContactMessage,
  NewContactMessage,
  CreateContactMessageInput,
  PublicContactMessageInput,
  UpdateContactMessageInput,
  ContactMessageListQuery,
  ContactStatus,
};

export interface ContactMessageStats {
  all: number;
  new: number;
  read: number;
  replied: number;
  archived: number;
}
