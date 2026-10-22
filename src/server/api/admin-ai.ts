import { Hono } from 'hono';

import { AiSettingsUpdate, ChatInput, ConversationParam, ListModelsInput } from '@/lib/ai/schema';
import type { AppEnv } from '@/server/api/types';
import { ok } from '@/server/lib/response';
import { zValidator } from '@/server/lib/validator';
import { actorLimit } from '@/server/middleware/actor-limit';
import { actorOf, can } from '@/server/middleware/auth';
import { notViewingAs } from '@/server/middleware/view-as';
import {
  deleteConversation,
  getConversation,
  listConversations,
} from '@/server/repositories/ai-conversation-repository';
import { startChat } from '@/server/services/ai/chat';
import { getAiAdmin, getAiStatus, listModelsFor, saveAiSettings, testConnection } from '@/server/services/ai/service';

// MK R11.
export const AI_CHAT_LIMIT = { limit: 30, windowMs: 600_000 };
export const AI_TEST_LIMIT = { limit: 5, windowMs: 60_000 };
export const AI_MODELS_LIMIT = { limit: 10, windowMs: 60_000 };

const READ_ONLY_VIEW_AS = 'View-as is read-only: AI assistant settings cannot be changed';

export const adminAi = new Hono<AppEnv>()
  .get('/status', can({ ai: ['use'] }), async (c) => ok(c, await getAiStatus(actorOf(c))))

  .get('/settings', can({ ai: ['manage'] }), async (c) => ok(c, await getAiAdmin()))

  .put(
    '/settings',
    can({ ai: ['manage'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    zValidator('json', AiSettingsUpdate),
    async (c) => ok(c, await saveAiSettings(actorOf(c), c.req.valid('json'))),
  )

  .post(
    '/settings/models',
    can({ ai: ['manage'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    actorLimit('ai-models', AI_MODELS_LIMIT),
    zValidator('json', ListModelsInput),
    async (c) => ok(c, await listModelsFor(actorOf(c), c.req.valid('json'))),
  )

  .post(
    '/settings/test',
    can({ ai: ['manage'] }),
    notViewingAs(READ_ONLY_VIEW_AS),
    actorLimit('ai-test', AI_TEST_LIMIT),
    async (c) => ok(c, await testConnection(actorOf(c))),
  )

  .post(
    '/chat',
    can({ ai: ['use'] }),
    notViewingAs('You can read conversations while viewing as someone, but not send messages'),
    actorLimit('ai-chat', AI_CHAT_LIMIT),
    zValidator('json', ChatInput),
    (c) => startChat(actorOf(c), c.req.valid('json'), c.req.raw.signal),
  )

  .get('/conversations', can({ ai: ['use'] }), async (c) =>
    ok(c, { items: await listConversations(actorOf(c).userId) }),
  )

  .get('/conversations/:id', can({ ai: ['use'] }), zValidator('param', ConversationParam), async (c) =>
    ok(c, await getConversation(actorOf(c).userId, c.req.valid('param').id)),
  )

  .delete(
    '/conversations/:id',
    can({ ai: ['use'] }),
    notViewingAs("You can't delete conversations while viewing as someone"),
    zValidator('param', ConversationParam),
    async (c) => ok(c, await deleteConversation(actorOf(c), c.req.valid('param').id)),
  );
