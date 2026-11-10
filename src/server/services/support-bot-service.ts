import { getInsuranceEnabled } from '@/server/queries/get-features';
import 'server-only';

import { generateText, isStepCount, tool } from 'ai';
import * as z from 'zod';

import type { SupportSender } from '@/lib/support/types';
import { siteNameFrom } from '@/lib/content/site-name';
import { buildKnowledge } from '@/server/lib/support/bot-knowledge';
import { buildBotPrompt, tidyReply, toModelMessages } from '@/server/lib/support/bot-prompt';
import { createBudget } from '@/server/lib/support/limits';
import { publishSupportEvent } from '@/server/lib/support/realtime';
import { serviceRepository } from '@/server/repositories/service-repository';
import { supportRepository } from '@/server/repositories/support-repository';
import { testimonialRepository } from '@/server/repositories/testimonial-repository';
import { errorTag } from '@/server/services/ai/errors';
import { getModel, mockEnabled } from '@/server/services/ai/provider';
import { decryptApiKey, isConfigured, readAiSettings } from '@/server/services/ai/settings';
import { firstNameOf } from '@/server/services/ai/prompt';
import { readEffectiveGlobal } from '@/server/services/globals-service';
import { supportKnowledgeService } from '@/server/services/support-knowledge-service';
import { notifyTeamNeedsHuman } from '@/server/services/support-notify';

const HISTORY = 20;
const MAX_OUTPUT_TOKENS = 400;
const TIMEOUT_MS = 40_000;
const KNOWLEDGE_TTL_MS = 60_000;
const ACTIVE_TTL_MS = 15_000;

const FAILED_NOTICE = 'Our team has been notified and will reply soon.';
const LIMIT_NOTICE = 'A team member will pick this up.';
const HANDOFF_FALLBACK = 'Thanks, a team member will reply here shortly.';

// Site-wide ceiling on AI replies, on top of the per-chat cap, for a flood across many chats.
const replyBudget = createBudget(300, 60 * 60_000);

// Chats being answered right now in this process: a second message sent meanwhile must not start a
// second answer. (Another server instance could still overlap; the reply cap bounds the cost.)
const inFlight = new Set<string>();

// The AI answers an open chat that no person holds. A chat flagged for a person is still answered
// until one takes it: the visitor must not be met with silence while they wait.
const aiOwns = (c: { status: string; aiEnabled: boolean; assignedTo: string | null }) =>
  c.status === 'open' && c.aiEnabled && !c.assignedTo;

export type BotOutcome = 'replied' | 'skipped' | 'handoff' | 'failed';

async function botActive() {
  const [bot, ai] = await Promise.all([readEffectiveGlobal('supportBot').then((s) => s.value), readAiSettings()]);
  return { bot, ai: ai.value, active: bot.enabled && (mockEnabled() || isConfigured(ai.value)) };
}

let cached: { text: string; at: number } | null = null;

// What the assistant may state as fact. Short-lived cache: it is the same for every visitor.
async function knowledge(): Promise<string> {
  if (cached && Date.now() - cached.at < KNOWLEDGE_TTL_MS) return cached.text;
  const [site, contact, services, reviews] = await Promise.all([
    readEffectiveGlobal('site').then((s) => s.value),
    readEffectiveGlobal('contact').then((s) => s.value),
    serviceRepository.listPublished(),
    testimonialRepository.listPublished({ limit: 5 }),
  ]);
  const address = [...contact.address.lines, contact.address.city, contact.address.eircode, contact.address.country]
    .filter(Boolean)
    .join(', ');
  const text = buildKnowledge({
    siteName: siteNameFrom(site.name),
    services: services.map((s) => ({
      name: s.name,
      description: s.description,
      checklist: s.checklist,
      startingPrice: s.startingPrice,
    })),
    contact: {
      phone: contact.phone.display,
      emergencyPhone: contact.emergencyPhone,
      email: contact.email,
      whatsapp: contact.whatsapp,
      address,
      hours: contact.hours.summary,
    },
    reviews: reviews.map((r) => ({ author: r.customerName, body: r.reviewText })),
  });
  cached = { text, at: Date.now() };
  return text;
}

// Marks the chat as needing a person, tells the visitor, and emails the team (once per chat).
async function escalate(id: string, notice: string | null) {
  const first = await supportRepository.flagNeedsHuman(id);
  if (notice) {
    await supportRepository.addMessage({ conversationId: id, sender: 'system', body: notice });
    await publishSupportEvent({ type: 'message', conversationId: id, assignedTo: null, from: 'system' });
  }
  await publishSupportEvent({ type: 'conversation', conversationId: id, assignedTo: null });
  if (first) notifyTeamNeedsHuman(id).catch(() => console.error('[support] needs-human email failed'));
}

type Generated = { body: string; handoff: boolean };

// The last two things the visitor wrote: a follow-up like "and the price?" still carries the topic.
const questionOf = (history: { sender: SupportSender; body: string }[]) =>
  history
    .filter((m) => m.sender === 'visitor')
    .slice(-2)
    .map((m) => m.body)
    .join(' ');

async function generate(
  chat: { visitorName: string | null },
  history: { sender: SupportSender; body: string }[],
  bot: { botName: string; extraInstructions: string },
  ai: Parameters<typeof decryptApiKey>[0],
): Promise<Generated> {
  const model = await getModel({
    provider: ai.provider,
    model: ai.model,
    baseUrl: ai.baseUrl,
    apiKey: decryptApiKey(ai),
  });
  let handoff = false;
  const result = await generateText({
    model,
    instructions: buildBotPrompt({
      botName: bot.botName,
      siteName: siteNameFrom((await readEffectiveGlobal('site')).value.name),
      // The synced website memory, ranked for what the visitor just asked; the live content if never synced.
      knowledge: (await supportKnowledgeService.contextFor(questionOf(history))) ?? (await knowledge()),
      extra: bot.extraInstructions,
      // First name only: the model never sees an email, surname or page query.
      visitorFirstName: chat.visitorName ? firstNameOf(chat.visitorName) || null : null,
      today: new Date().toISOString().slice(0, 10),
      insurance: await getInsuranceEnabled(),
    }),
    messages: toModelMessages(history),
    tools: {
      handoffToHuman: tool({
        description:
          'Ask a human team member to take over this chat. Use when you cannot answer from the business information, or the visitor wants a person, a quote or a booking.',
        inputSchema: z.object({ reason: z.string().max(200) }),
        execute: async () => {
          handoff = true;
          return 'A team member has been asked to take over.';
        },
      }),
    },
    stopWhen: isStepCount(2),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = tidyReply(result.text) || (handoff ? HANDOFF_FALLBACK : '');
  if (!body) throw new Error('empty answer');
  return { body, handoff };
}

// Cached for a few seconds: the visitor view asks on every poll.
let activeCache: { value: boolean; at: number } | null = null;

export const supportBotService = {
  isActive: async () => (await botActive()).active,

  async isActiveCached() {
    if (activeCache && Date.now() - activeCache.at < ACTIVE_TTL_MS) return activeCache.value;
    const value = (await botActive()).active;
    activeCache = { value, at: Date.now() };
    return value;
  },

  async maybeReply(id: string): Promise<BotOutcome> {
    if (inFlight.has(id)) return 'skipped';
    inFlight.add(id);
    try {
      const { bot, ai, active } = await botActive();
      if (!active) return 'skipped';
      const chat = await supportRepository.byId(id);
      if (!chat || !aiOwns(chat)) return 'skipped';
      let history = await supportRepository.recentForModel(id, HISTORY);
      if (history.at(-1)?.sender !== 'visitor') return 'skipped';

      if ((await supportRepository.aiReplyCount(id)) >= bot.maxAiReplies || !replyBudget.take()) {
        await escalate(id, LIMIT_NOTICE);
        return 'handoff';
      }

      let answer = await generate(chat, history, bot, ai);
      // The visitor may have written again while it was thinking: answer the newer conversation once.
      const fresh = await supportRepository.recentForModel(id, HISTORY);
      if (fresh.length > history.length && fresh.at(-1)?.sender === 'visitor') {
        history = fresh;
        answer = await generate(chat, history, bot, ai);
      }

      // `requireAiEnabled`: if a person took the chat meanwhile, or it closed, this stores nothing.
      const stored = await supportRepository.addMessage({
        conversationId: id,
        sender: 'ai',
        body: answer.body,
        senderName: bot.botName,
        requireAiEnabled: true,
      });
      if (!stored) return 'skipped';
      await publishSupportEvent({ type: 'message', conversationId: id, assignedTo: null, from: 'ai' });
      if (answer.handoff) {
        await escalate(id, null);
        return 'handoff';
      }
      return 'replied';
    } catch (error) {
      // Class and code only: messages and queries can carry what the visitor wrote.
      console.error('[support] ai reply failed', errorTag(error));
      try {
        // A person may have taken the chat while the provider was failing: say nothing then.
        const current = await supportRepository.byId(id);
        if (!current || !aiOwns(current)) return 'skipped';
        await escalate(id, FAILED_NOTICE);
      } catch {
        console.error('[support] could not flag the chat for a person');
      }
      return 'failed';
    } finally {
      inFlight.delete(id);
    }
  },
};
