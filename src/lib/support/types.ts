// Shapes shared by the API and both chat UIs. No server imports: the public widget uses these.
export type SupportSender = 'visitor' | 'staff' | 'system' | 'ai';
export type SupportStatus = 'open' | 'closed';

export type SupportMessageDto = {
  id: string;
  sender: SupportSender;
  senderName: string | null;
  body: string;
  createdAt: string;
};

export type VisitorConversationDto = {
  id: string;
  status: SupportStatus;
  agentName: string | null;
  hasEmail: boolean;
  // The AI assistant is the one answering right now.
  aiActive: boolean;
  messages: SupportMessageDto[];
};

export type SupportListItemDto = {
  id: string;
  status: SupportStatus;
  visitorName: string | null;
  visitorEmail: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  preview: string | null;
  lastMessageAt: string;
  unread: boolean;
  needsHuman: boolean;
};

export type SupportDetailDto = SupportListItemDto & {
  sourcePath: string | null;
  aiEnabled: boolean;
  createdAt: string;
  messages: SupportMessageDto[];
};

export type SupportAgentDto = { id: string; name: string; online: boolean };

// Only ids cross the event channel: Postgres NOTIFY is capped at 8000 bytes, and message
// text stays out of it. Clients re-read the conversation through the authorised API.
export type SupportEvent = {
  type: 'message' | 'conversation';
  conversationId: string;
  assignedTo: string | null;
  from?: SupportSender;
};
