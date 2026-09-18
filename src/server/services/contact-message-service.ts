import { contactMessageRepository } from '@/server/repositories/contact-message-repository';
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

  async create(data: CreateContactMessageInput) {
    return contactMessageRepository.create(data);
  },

  async update(id: string, data: UpdateContactMessageInput) {
    return contactMessageRepository.update(id, data);
  },

  async remove(id: string) {
    return contactMessageRepository.remove(id);
  },
};
