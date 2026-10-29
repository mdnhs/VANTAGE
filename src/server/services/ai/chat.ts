import 'server-only';

import { randomUUID } from 'node:crypto';

import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream } from 'ai';

import { HISTORY_LIMIT, labelOnlyChunk, persistableParts, trimHistory, type AiUIMessage } from '@/lib/ai/messages';
import type { ChatInput } from '@/lib/ai/schema';
import { hasPermission } from '@/lib/auth/permissions';
import { audit } from '@/server/lib/audit';
import type { Actor } from '@/server/lib/auth/actor';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import {
  appendMessage,
  createConversation,
  historyFor,
  lastReplyId,
  ownConversation,
  ownUserMessage,
  replaceFrom,
  titleFrom,
} from '@/server/repositories/ai-conversation-repository';
import { readEffectiveGlobal } from '@/server/services/globals-service';

import { contextSubject } from './context';
import { DECLINED_MESSAGE, errorTag, friendlyChatError, LENGTH_EXHAUSTED_MESSAGE, ToolFailure } from './errors';
import { buildSystemPrompt, firstNameOf } from './prompt';
import { getModel } from './provider';
import { decryptApiKey, readAiSettings, roleAllowed, type AiStored } from './settings';
import { buildTools } from './tools';
import { siteNameFrom } from '@/lib/content/site-name';

export const MAX_STEPS = 5;

type Turn = { tokensIn: number; tokensOut: number; tools: Set<string> };

function assertCanChat(s: AiStored, actor: Actor) {
  if (!s.enabled) throw ApiError.forbidden('The AI assistant is turned off');
  if (!roleAllowed(s, actor.roles)) throw ApiError.forbidden("The AI assistant isn't available for your role");
}

// Enquiry details need the opt-in and a read permission.
export const canShareEnquiries = (s: AiStored, actor: Actor) =>
  s.shareEnquiryDetails.enabled &&
  (hasPermission(actor.roles, { quote: ['read'] }) || hasPermission(actor.roles, { contact: ['read'] }));

// Provider, model, counts and tool names; never text or titles.
const summary = (s: AiStored, t: Turn, stopped: boolean, mode: 'regenerated' | 'edited' | null) =>
  `Asked the AI assistant (${s.provider} · ${s.model} · ${t.tokensIn} in / ${t.tokensOut} out tokens${
    t.tools.size ? ` · tools: ${[...t.tools].join(', ')}` : ''
  }${mode ? ` · ${mode}` : ''}${stopped ? ' · stopped' : ''})`;

function streamError(error: unknown, s: AiStored) {
  if (error instanceof ToolFailure) return error.message;
  console.error('[ai] chat failed', errorTag(error));
  return friendlyChatError(error, s.provider);
}

// The new message is written before streaming, so a failure there would reach
// the global error handler, which logs the whole error. A database error carries
// the query parameters (the message text, the title), so it is logged as a tag
// here and the person gets the generic message.
async function saving<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    console.error('[ai] could not save your message', errorTag(error));
    throw new ApiError(ERROR_CODES.INTERNAL_ERROR, "Couldn't save your message. Try again.", 500);
  }
}

// Which conversation, and what was written before streaming. A plain message is
// appended. Regenerate runs the turn again from
// the person's last message. Edit replaces one of their own messages and everything
// after it. Ownership of the conversation, and of the message within it, is part of
// every lookup, so another person's ids are simply not found.
async function prepareTurn(actor: Actor, input: ChatInput, model: string) {
  if (input.regenerate) {
    const conversation = await ownConversation(actor.userId, input.conversationId!);
    const replaces = await saving(() => lastReplyId(conversation.id));
    return { conversation, mode: 'regenerated' as const, replaces };
  }
  const userMessage: AiUIMessage = { id: randomUUID(), role: 'user', parts: [{ type: 'text', text: input.text! }] };
  if (input.editMessageId) {
    const conversation = await ownConversation(actor.userId, input.conversationId!);
    const from = await ownUserMessage(conversation.id, input.editMessageId);
    await saving(() => replaceFrom(conversation.id, from, userMessage));
    return { conversation, mode: 'edited' as const, replaces: null };
  }
  const conversation = input.conversationId
    ? await ownConversation(actor.userId, input.conversationId)
    : await saving(() => createConversation(actor.userId, titleFrom(input.text!), model));
  await saving(() => appendMessage(conversation.id, userMessage));
  return { conversation, mode: null, replaces: null };
}

const today = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Dublin',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .replace(',', '');

export async function startChat(actor: Actor, input: ChatInput, signal?: AbortSignal): Promise<Response> {
  const { value: settings } = await readAiSettings();
  assertCanChat(settings, actor);
  const model = await getModel({ ...settings, apiKey: decryptApiKey(settings) });
  const { conversation, mode, replaces } = await prepareTurn(actor, input, settings.model);

  // Every turn comes from our rows, the new one saved first. Enquiry details need
  // the opt-in and a read permission. Replies written under it are flagged, and
  // stay out of the history once it's off.
  const sharing = canShareEnquiries(settings, actor);
  const history = await historyFor(conversation.id, HISTORY_LIMIT, { includeShared: sharing, excludeId: replaces });
  const userMessage = history.at(-1);
  if (userMessage?.role !== 'user') throw ApiError.conflict("There's no message to answer yet");

  const tools = buildTools({ actor, settings });
  const site = (await readEffectiveGlobal('site')).value;
  const turn: Turn = { tokensIn: 0, tokensOut: 0, tools: new Set() };
  const result = streamText({
    model,
    instructions: buildSystemPrompt({
      siteName: siteNameFrom(site.name),
      firstName: firstNameOf(actor.name),
      roles: actor.roles,
      today: today(),
      toolNames: Object.keys(tools),
      extra: settings.systemPrompt,
      context: await contextSubject(actor, input.context),
    }),
    messages: await convertToModelMessages(trimHistory(history)),
    tools,
    stopWhen: isStepCount(MAX_STEPS),
    maxOutputTokens: settings.maxOutputTokens,
    maxRetries: 1,
    timeout: { totalMs: 120_000, chunkMs: 30_000 },
    // Stop in the sheet aborts the fetch, which aborts the provider call.
    abortSignal: signal,
    // The default logs the whole error, provider body (and so any echoed key)
    // included. streamError below logs a tag instead.
    onError: () => {},
    onStepEnd: (step) => {
      turn.tokensIn += step.usage.inputTokens ?? 0;
      turn.tokensOut += step.usage.outputTokens ?? 0;
      for (const call of step.toolCalls) turn.tools.add(call.toolName);
    },
  });
  // Keeps the pipeline draining so onEnd (save + audit) always runs.
  void result.consumeStream({ onError: () => {} });

  const ui = toUIMessageStream<typeof tools, AiUIMessage>({
    stream: result.stream,
    tools,
    sendReasoning: false,
    generateMessageId: randomUUID,
    messageMetadata: ({ part }) =>
      part.type === 'start' ? { conversationId: conversation.id, userMessageId: userMessage.id } : undefined,
    onError: (error) => streamError(error, settings),
    // A stopped answer keeps what was streamed: its text and the labels of finished
    // lookups. Half-done tool calls are dropped, so the saved row is always a
    // complete message.
    onEnd: async ({ responseMessage, isAborted, isCancelled }) => {
      try {
        const parts = persistableParts(responseMessage.parts);
        if (parts.length) {
          await appendMessage(
            conversation.id,
            { ...responseMessage, parts },
            {
              tokensIn: turn.tokensIn,
              tokensOut: turn.tokensOut,
              sharedEnquiryDetails: sharing,
              replaces: replaces ?? undefined,
            },
          );
        }
        await audit(actor, {
          action: 'ai.chat',
          entityType: 'ai_conversation',
          entityId: conversation.id,
          summary: summary(settings, turn, isAborted || isCancelled === true || signal?.aborted === true, mode),
        });
      } catch (error) {
        console.error('[ai] could not save the reply', errorTag(error));
      }
    },
  });

  // A turn that ends with no text at all (`length` after thinking used the budget,
  // or the provider declined) gets a friendly error before the stream finishes.
  let sawText = false;
  return createUIMessageStreamResponse({
    // no-transform: Next's gzip (`compress`) and proxies leave SSE unbuffered.
    headers: { 'cache-control': 'no-cache, no-transform' },
    stream: ui.pipeThrough(
      new TransformStream({
        transform: (chunk, controller) => {
          if (chunk.type === 'text-delta' && chunk.delta.trim()) sawText = true;
          if (chunk.type === 'finish' && !sawText) {
            if (chunk.finishReason === 'length') {
              controller.enqueue({ type: 'error', errorText: LENGTH_EXHAUSTED_MESSAGE });
            } else if (chunk.finishReason === 'content-filter') {
              controller.enqueue({ type: 'error', errorText: DECLINED_MESSAGE });
            }
          }
          controller.enqueue(labelOnlyChunk(chunk));
        },
      }),
    ),
  });
}
