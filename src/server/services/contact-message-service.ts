import type { SpamReason } from '@/lib/enquiries/spam';
import { contactMessageRepository } from '@/server/repositories/contact-message-repository';
import { notifyNewContact } from '@/server/services/enquiry-notify';
import type {
  CreateContactMessageInput,
  ContactMessageListQuery,
  UpdateContactMessageInput,
} from '@/validations/contact-message-schema';

export const contactMessageService = {
  async list(params: ContactMessageListQuery) {
    return contactMessageRepository.list(params);
  },

  async stats() {
    return contactMessageRepository.stats();
  },

  async byId(id: string) {
    return contactMessageRepository.byId(id);
  },

  // `spamReason` files the row as spam and sends nothing.
  async create(data: CreateContactMessageInput, options: { photoMediaIds?: string[]; spamReason?: SpamReason } = {}) {
    const row = await contactMessageRepository.create(data, options.photoMediaIds, options.spamReason);
    // After the row is committed; fire-and-forget, so mail never fails the request.
    if (row && !options.spamReason) notifyNewContact(row);
    return row;
  },

  async update(id: string, data: UpdateContactMessageInput) {
    return contactMessageRepository.update(id, data);
  },

  async remove(id: string) {
    return contactMessageRepository.remove(id);
  },
};
