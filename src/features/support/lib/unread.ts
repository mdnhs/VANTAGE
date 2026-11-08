import type { SupportMessageDto } from '@/lib/support/types';

// Replies from staff that arrived after the last message the visitor saw. Tracked by id rather
// than position, because the server only sends the newest messages of a very long chat.
export function countUnread(messages: SupportMessageDto[], seenId: string | null): number {
  const after = messages.slice(messages.findIndex((m) => m.id === seenId) + 1);
  return after.filter((m) => m.sender === 'staff').length;
}
