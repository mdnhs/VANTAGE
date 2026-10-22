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

  async create(data: CreateContactMessageInput, photoMediaIds: string[] = []) {
    const row = await contactMessageRepository.create(data, photoMediaIds);
    // After the row is committed; fire-and-forget, so mail never fails the request.
    if (row) notifyNewContact(row);
    return row;
  },

  async update(id: string, data: UpdateContactMessageInput) {
    return contactMessageRepository.update(id, data);
  },

  async remove(id: string) {
    return contactMessageRepository.remove(id);
  },
};
