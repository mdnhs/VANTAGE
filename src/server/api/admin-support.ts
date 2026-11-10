import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';

import { hasPermission } from '@/lib/auth/permissions';
import type { AppEnv } from '@/server/api/types';
import { ApiError } from '@/server/lib/errors';
import { ok } from '@/server/lib/response';
import { supportStream } from '@/server/lib/support/realtime';
import { zValidator } from '@/server/lib/validator';
import { auditRoute } from '@/server/middleware/audit-route';
import { actorOf, can } from '@/server/middleware/auth';
import { notViewingAs, VIEW_AS_READ_ONLY } from '@/server/middleware/view-as';
import { supportKnowledgeService } from '@/server/services/support-knowledge-service';
import { supportService } from '@/server/services/support-service';
import {
  supportAiSchema,
  supportAssignSchema,
  supportListQuerySchema,
  supportMessageSchema,
} from '@/validations/support-schema';

const idParamSchema = z.object({ id: z.string().uuid() });

const SMALL_BODY = bodyLimit({
  maxSize: 16 * 1024,
  onError: () => {
    throw ApiError.payloadTooLarge('That message is too long');
  },
});

export const adminSupport = new Hono<AppEnv>()
  .get('/unread', can({ support: ['read'] }), async (c) => ok(c, await supportService.unread(actorOf(c))))

  .get('/agents', can({ support: ['assign'] }), async (c) => ok(c, await supportService.agents()))

  // The AI's website memory. Managing it is a settings task, like the rest of Live chat AI.
  .get('/knowledge', can({ settings: ['read'] }), async (c) => ok(c, await supportKnowledgeService.status()))

  .post(
    '/knowledge/sync',
    can({ settings: ['update'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'support.knowledge_sync',
      entityType: 'support_knowledge',
      summary: 'Live chat AI memory synced from the website',
    }),
    async (c) => ok(c, await supportKnowledgeService.start(actorOf(c)), { status: 202 }),
  )

  .get('/stream', can({ support: ['read'] }), (c) => {
    const actor = actorOf(c);
    const seesAll = supportService.canSeeAll(actor);
    return supportStream(c, {
      accept: (event) => seesAll || event.assignedTo === actor.userId,
      // Only someone who can answer counts as "online"; View-as is never a real agent.
      agentId: !actor.impersonatedBy && hasPermission(actor.roles, { support: ['reply'] }) ? actor.userId : null,
    });
  })

  .get('/conversations', can({ support: ['read'] }), zValidator('query', supportListQuerySchema), async (c) =>
    ok(c, await supportService.list(actorOf(c), c.req.valid('query'))),
  )

  .get('/conversations/:id', can({ support: ['read'] }), zValidator('param', idParamSchema), async (c) =>
    ok(c, await supportService.detail(actorOf(c), c.req.valid('param').id)),
  )

  .delete(
    '/conversations/:id',
    can({ support: ['assign'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'support.delete',
      entityType: 'support_chat',
      summary: 'Live chat deleted',
      load: supportService.byId,
      fields: ['status'],
    }),
    zValidator('param', idParamSchema),
    async (c) => ok(c, await supportService.remove(actorOf(c), c.req.valid('param').id)),
  )

  .post(
    '/conversations/:id/messages',
    can({ support: ['reply'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    SMALL_BODY,
    zValidator('param', idParamSchema),
    zValidator('json', supportMessageSchema),
    async (c) =>
      ok(c, await supportService.staffSend(actorOf(c), c.req.valid('param').id, c.req.valid('json').body), {
        status: 201,
      }),
  )

  .post(
    '/conversations/:id/read',
    can({ support: ['read'] }),
    notViewingAs('Viewing as someone never marks their chats as read'),
    zValidator('param', idParamSchema),
    async (c) => ok(c, await supportService.markRead(actorOf(c), c.req.valid('param').id)),
  )

  .post(
    '/conversations/:id/assign',
    can({ support: ['assign'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'support.assign',
      entityType: 'support_chat',
      summary: 'Live chat assigned',
      load: supportService.byId,
      fields: ['assignedTo'],
    }),
    zValidator('param', idParamSchema),
    zValidator('json', supportAssignSchema),
    async (c) => ok(c, await supportService.assign(actorOf(c), c.req.valid('param').id, c.req.valid('json').userId)),
  )

  .post(
    '/conversations/:id/ai',
    can({ support: ['reply'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'support.ai',
      entityType: 'support_chat',
      summary: 'Live chat AI toggled',
      load: supportService.byId,
      fields: ['aiEnabled', 'assignedTo'],
    }),
    zValidator('param', idParamSchema),
    zValidator('json', supportAiSchema),
    async (c) => ok(c, await supportService.setAi(actorOf(c), c.req.valid('param').id, c.req.valid('json').enabled)),
  )

  .post(
    '/conversations/:id/close',
    can({ support: ['reply'] }),
    notViewingAs(VIEW_AS_READ_ONLY),
    auditRoute({
      action: 'support.close',
      entityType: 'support_chat',
      summary: 'Live chat closed',
      load: supportService.byId,
      fields: ['status'],
    }),
    zValidator('param', idParamSchema),
    async (c) => ok(c, await supportService.close(actorOf(c), c.req.valid('param').id)),
  );
