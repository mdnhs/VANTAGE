import type { ContactMessage, NewContactMessage } from '@/server/db/schema';
import {
  CONTACT_STATUSES,
  type CreateContactMessageInput,
  type ContactMessageListQuery,
  type ContactStatus,
  type UpdateContactMessageInput,
} from '@/validations/contact-message-schema';

export { CONTACT_STATUSES };

export type {
  ContactMessage,
  NewContactMessage,
  CreateContactMessageInput,
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
