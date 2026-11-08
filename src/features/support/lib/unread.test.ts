import { describe, expect, it } from 'vitest';

import type { SupportMessageDto, SupportSender } from '@/lib/support/types';

import { countUnread } from './unread';

const message = (id: string, sender: SupportSender): SupportMessageDto => ({
  id,
  sender,
  senderName: null,
  body: id,
  createdAt: '2026-11-08T12:00:00.000Z',
});

describe('countUnread', () => {
  const chat = [message('1', 'visitor'), message('2', 'staff'), message('3', 'system'), message('4', 'staff')];

  it('counts staff replies after the last message seen', () => {
    expect(countUnread(chat, '2')).toBe(1);
  });

  it('does not count notices such as "joined the chat"', () => {
    expect(countUnread([message('1', 'visitor'), message('2', 'system')], '1')).toBe(0);
  });

  it('does not count the visitor’s own messages', () => {
    expect(countUnread([message('1', 'staff'), message('2', 'visitor')], '1')).toBe(0);
  });

  it('counts every staff reply when nothing has been seen', () => {
    expect(countUnread(chat, null)).toBe(2);
  });

  it('is zero when the newest message was seen', () => {
    expect(countUnread(chat, '4')).toBe(0);
  });

  it('still works once the seen message has aged out of the loaded window', () => {
    expect(countUnread(chat, 'long-gone')).toBe(2);
  });
});
