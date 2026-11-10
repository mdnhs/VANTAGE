import { MockLanguageModelV4 } from 'ai/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  bot: { enabled: true, botName: 'AI assistant', extraInstructions: '', maxAiReplies: 30 },
  aiConfigured: true,
  chat: {
    id: 'c1',
    status: 'open',
    aiEnabled: true,
    assignedTo: null as string | null,
    visitorName: 'Aoife Byrne',
    visitorEmail: 'aoife@example.com',
    sourcePath: '/services?utm=x',
    needsHuman: false,
  },
  history: [{ sender: 'visitor', body: 'Do you fix dents?' }] as { sender: string; body: string }[],
  aiCount: 0,
  addMessage: vi.fn(),
  flagNeedsHuman: vi.fn(),
  publish: vi.fn(),
  notify: vi.fn(),
  memory: vi.fn(),
  model: null as unknown,
}));

vi.mock('@/server/services/globals-service', () => ({
  readEffectiveGlobal: async (key: string) => ({
    value:
      key === 'supportBot'
        ? h.bot
        : key === 'site'
          ? { name: 'Vantage Body Repairs' }
          : {
              phone: { display: '+353 1 234 5678' },
              emergencyPhone: '',
              email: 'hello@example.ie',
              whatsapp: '',
              address: { lines: ['Unit 4'], city: 'Dublin', eircode: '', country: '' },
              hours: { summary: 'Mon–Fri 8–18' },
            },
  }),
}));
vi.mock('@/server/services/ai/settings', () => ({
  readAiSettings: async () => ({ value: { provider: 'google', model: 'm', baseUrl: '', apiKeyEncrypted: 'x' } }),
  decryptApiKey: () => 'key',
  isConfigured: () => h.aiConfigured,
}));
vi.mock('@/server/services/ai/provider', () => ({ getModel: async () => h.model, mockEnabled: () => false }));
vi.mock('@/server/repositories/support-repository', () => ({
  supportRepository: {
    byId: async () => h.chat,
    recentForModel: async () => h.history,
    aiReplyCount: async () => h.aiCount,
    addMessage: h.addMessage,
    flagNeedsHuman: h.flagNeedsHuman,
  },
}));
vi.mock('@/server/repositories/service-repository', () => ({
  serviceRepository: {
    listPublished: async () => [
      { name: 'Dent repair', description: 'We fix dents.', checklist: [], startingPrice: 450 },
    ],
  },
}));
vi.mock('@/server/repositories/testimonial-repository', () => ({
  testimonialRepository: { listPublished: async () => [{ customerName: 'Sam', reviewText: 'Great.' }] },
}));
vi.mock('@/server/lib/support/realtime', () => ({ publishSupportEvent: h.publish }));
vi.mock('@/server/services/support-knowledge-service', () => ({ supportKnowledgeService: { contextFor: h.memory } }));
vi.mock('@/server/services/support-notify', () => ({ notifyTeamNeedsHuman: h.notify }));

import { supportBotService } from './support-bot-service';

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};
const stop = { unified: 'stop' as const, raw: undefined };
const text = (t: string) => ({
  content: [{ type: 'text' as const, text: t }],
  finishReason: stop,
  usage,
  warnings: [],
});

const seen: unknown[] = [];
const modelReturning = (...responses: object[]) => {
  let i = 0;
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      seen.push(options);
      return (responses[Math.min(i++, responses.length - 1)] ?? text('OK')) as never;
    },
  });
};

beforeEach(() => {
  seen.length = 0;
  Object.assign(h.bot, { enabled: true, maxAiReplies: 30, extraInstructions: '' });
  Object.assign(h.chat, { status: 'open', aiEnabled: true, assignedTo: null, needsHuman: false });
  h.aiConfigured = true;
  h.history = [{ sender: 'visitor', body: 'Do you fix dents?' }];
  h.aiCount = 0;
  h.addMessage.mockReset().mockResolvedValue({ id: 'm1' });
  h.flagNeedsHuman.mockReset().mockResolvedValue(true);
  h.publish.mockReset().mockResolvedValue(undefined);
  h.memory.mockReset().mockResolvedValue(null);
  h.notify.mockReset().mockResolvedValue(undefined);
  h.model = modelReturning(text('Yes, we repair dents. A quote depends on the damage.'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('supportBotService.maybeReply', () => {
  it('stores one ai reply and tells the streams', async () => {
    expect(await supportBotService.maybeReply('c1')).toBe('replied');
    expect(h.addMessage).toHaveBeenCalledTimes(1);
    expect(h.addMessage.mock.calls[0]![0]).toMatchObject({
      conversationId: 'c1',
      sender: 'ai',
      senderName: 'AI assistant',
      body: 'Yes, we repair dents. A quote depends on the damage.',
      requireAiEnabled: true,
    });
    expect(h.publish).toHaveBeenCalledWith({ type: 'message', conversationId: 'c1', assignedTo: null, from: 'ai' });
  });

  it('does not call the model when the bot is off, not set up, or the chat is not the ai’s', async () => {
    const calls = () => seen.length;
    h.bot.enabled = false;
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    h.bot.enabled = true;
    h.aiConfigured = false;
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    h.aiConfigured = true;
    h.chat.aiEnabled = false;
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    h.chat.aiEnabled = true;
    h.chat.assignedTo = 'staff-1';
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    h.chat.assignedTo = null;
    h.chat.needsHuman = true;
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    h.chat.needsHuman = false;
    h.chat.status = 'closed';
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    h.chat.status = 'open';
    h.history = [{ sender: 'ai', body: 'Already answered' }];
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    expect(calls()).toBe(0);
    expect(h.addMessage).not.toHaveBeenCalled();
  });

  it('drops the answer when a person took over while it was being written', async () => {
    h.addMessage.mockResolvedValue(null);
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    expect(h.publish).not.toHaveBeenCalled();
  });

  it('flags the chat, tells the visitor once and does not retry when the provider fails', async () => {
    h.model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error('provider down: secret text');
      },
    });
    expect(await supportBotService.maybeReply('c1')).toBe('failed');
    expect(h.flagNeedsHuman).toHaveBeenCalledWith('c1');
    expect(h.addMessage).toHaveBeenCalledTimes(1);
    expect(h.addMessage.mock.calls[0]![0]).toMatchObject({ sender: 'system' });
    expect(h.notify).toHaveBeenCalledWith('c1');
    // the log keeps the error class only, never its text
    expect(JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls)).not.toContain(
      'secret text',
    );
  });

  it('treats an empty answer like a failure', async () => {
    h.model = modelReturning(text('   '));
    expect(await supportBotService.maybeReply('c1')).toBe('failed');
    expect(h.flagNeedsHuman).toHaveBeenCalled();
  });

  it('hands off when the model calls handoffToHuman, and still sends its words', async () => {
    h.model = modelReturning(
      {
        content: [
          {
            type: 'tool-call',
            toolCallId: 't1',
            toolName: 'handoffToHuman',
            input: JSON.stringify({ reason: 'wants a quote' }),
          },
        ],
        finishReason: { unified: 'tool-calls', raw: undefined },
        usage,
        warnings: [],
      },
      text('A team member will reply here shortly.'),
    );
    expect(await supportBotService.maybeReply('c1')).toBe('handoff');
    expect(h.flagNeedsHuman).toHaveBeenCalledWith('c1');
    expect(h.notify).toHaveBeenCalledWith('c1');
    expect(h.addMessage.mock.calls.at(-1)![0]).toMatchObject({
      sender: 'ai',
      body: 'A team member will reply here shortly.',
    });
  });

  it('stops at the per-chat cap, flags the chat and never calls the model', async () => {
    h.aiCount = 30;
    expect(await supportBotService.maybeReply('c1')).toBe('handoff');
    expect(seen).toHaveLength(0);
    expect(h.flagNeedsHuman).toHaveBeenCalledWith('c1');
    expect(h.addMessage.mock.calls[0]![0]).toMatchObject({ sender: 'system' });
  });

  it('gives the model the rules and site facts, and never the visitor email or full name', async () => {
    h.bot.extraInstructions = 'Keep answers short.';
    await supportBotService.maybeReply('c1');
    const sentToModel = JSON.stringify(seen[0]);
    expect(sentToModel).toContain('Dent repair');
    expect(sentToModel).toContain('from €450');
    expect(sentToModel).toContain('Keep answers short.');
    expect(sentToModel).toMatch(/never reveal/i);
    expect(sentToModel).toContain('Aoife');
    expect(sentToModel).not.toContain('aoife@example.com');
    expect(sentToModel).not.toContain('Byrne');
    expect(sentToModel).not.toContain('utm=x');
  });
});

describe('supportBotService.maybeReply with the synced website memory', () => {
  it('answers from the memory, ranked by what the visitor asked, instead of the live content', async () => {
    h.memory.mockResolvedValue('MEMORY: Alloy Wheel Refurbishment (from €85)');
    h.history = [
      { sender: 'visitor', body: 'Hi' },
      { sender: 'ai', body: 'Hello!' },
      { sender: 'visitor', body: 'Do you repair alloy wheels?' },
    ];
    await supportBotService.maybeReply('c1');
    const sentToModel = JSON.stringify(seen[0]);
    expect(sentToModel).toContain('MEMORY: Alloy Wheel Refurbishment (from €85)');
    expect(sentToModel).not.toContain('Dent repair');
    expect(h.memory).toHaveBeenCalledWith('Hi Do you repair alloy wheels?');
  });
});

describe('supportBotService.maybeReply when called twice at once', () => {
  it('writes one answer while one is in progress', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    h.model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        seen.push(options);
        await gate;
        return text('Answer') as never;
      },
    });

    const first = supportBotService.maybeReply('c1');
    const second = await supportBotService.maybeReply('c1');
    expect(second).toBe('skipped');
    release();
    await first;
    expect(seen).toHaveLength(1);
    expect(h.addMessage).toHaveBeenCalledTimes(1);
  });

  it('lets the same chat be answered again once the first answer is done', async () => {
    await supportBotService.maybeReply('c1');
    await supportBotService.maybeReply('c1');
    expect(seen).toHaveLength(2);
  });
});

describe('supportBotService.maybeReply review fixes', () => {
  it('answers again with the newer message when the visitor wrote again while it was thinking', async () => {
    let calls = 0;
    h.model = new MockLanguageModelV4({
      doGenerate: async (options) => {
        seen.push(options);
        if (++calls === 1) h.history = [...h.history, { sender: 'visitor', body: 'Also, open Saturday?' }];
        return text(calls === 1 ? 'Old answer' : 'New answer') as never;
      },
    });
    expect(await supportBotService.maybeReply('c1')).toBe('replied');
    expect(seen).toHaveLength(2);
    expect(JSON.stringify(seen[1])).toContain('open Saturday');
    expect(h.addMessage).toHaveBeenCalledTimes(1);
    expect(h.addMessage.mock.calls[0]![0].body).toBe('New answer');
  });

  it('says nothing and flags nothing when a person took over before the provider failed', async () => {
    h.model = new MockLanguageModelV4({
      doGenerate: async () => {
        h.chat.aiEnabled = false;
        throw new Error('timeout');
      },
    });
    expect(await supportBotService.maybeReply('c1')).toBe('skipped');
    expect(h.flagNeedsHuman).not.toHaveBeenCalled();
    expect(h.addMessage).not.toHaveBeenCalled();
    expect(h.notify).not.toHaveBeenCalled();
  });
});

describe('supportBotService.isActive', () => {
  it('needs the switch on and a provider set up', async () => {
    expect(await supportBotService.isActive()).toBe(true);
    h.bot.enabled = false;
    expect(await supportBotService.isActive()).toBe(false);
    h.bot.enabled = true;
    h.aiConfigured = false;
    expect(await supportBotService.isActive()).toBe(false);
  });
});
