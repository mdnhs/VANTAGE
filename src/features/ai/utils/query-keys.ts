export const AI_KEYS = {
  status: ['ai', 'status'],
  settings: ['ai', 'settings'],
  conversations: ['ai', 'conversations'],
  conversation: (id: string) => ['ai', 'conversation', id],
} as const;
