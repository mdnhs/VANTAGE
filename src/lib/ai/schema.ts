import * as z from 'zod';

import { ROLE_NAMES, type RoleName } from '@/lib/auth/permissions';

// Isomorphic: the settings screen and the API validate with the same rules
// (MK docs/superpowers/specs/2026-10-11-ai-assistant-design.md §4).
export const AI_PROVIDERS = ['google', 'anthropic', 'openai-compatible'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  google: 'Google Gemini',
  anthropic: 'Anthropic Claude',
  'openai-compatible': 'OpenAI-compatible',
};

// Suggestions the form fills in when the provider changes (V9-R2).
export const DEFAULT_MODEL: Record<AiProvider, string> = {
  google: 'gemini-flash-lite-latest',
  anthropic: 'claude-opus-5-5',
  'openai-compatible': '',
};

// V9-R5: managers always keep the assistant; the setting gates the rest.
export const MANAGER_ROLES = ['owner', 'admin'] as const satisfies readonly RoleName[];
export const GATED_ROLES: RoleName[] = ROLE_NAMES.filter(
  (role) => !(MANAGER_ROLES as readonly RoleName[]).includes(role),
);

export const MAX_INPUT_CHARS = 8000;
export const OUTPUT_TOKENS = { min: 64, max: 8192, default: 1024 } as const;

export const GEMINI_FREE_TIER_WARNING =
  "On Gemini's free tier Google may use prompts to improve its products. Don't paste client details.";

export const ModelId = z
  .string()
  .trim()
  .min(1, 'Enter a model name')
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/@-]*$/, "Use the model's ID, like gemini-flash-lite-latest");

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const PRIVATE_V4 = [
  /^0\./,
  /^192\.0\.0\./,
  /^198\.1[89]\./,
  /^(22[4-9]|2[3-5]\d)\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

// `allowLocalHttp` is true only in development (V9-R6).
export function baseUrlProblem(raw: string, allowLocalHttp: boolean): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return 'Enter the full address, like https://api.groq.com/openai/v1';
  }
  if (url.username || url.password) return 'Remove the user name and password from the address';
  if (url.search || url.hash) return 'Remove the ? or # part from the address';
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const local = LOCAL_HOSTS.has(host);
  if (url.protocol === 'http:') {
    return allowLocalHttp && local
      ? null
      : 'Use an https:// address. Plain http is only allowed for localhost in development.';
  }
  if (url.protocol !== 'https:') return 'Use an https:// address';
  if (allowLocalHttp) return null;
  const internal =
    local ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.startsWith('[') ||
    PRIVATE_V4.some((range) => range.test(host));
  return internal ? "Use the provider's public address" : null;
}

// For "did the base URL change?" and for the provider factory.
export function normaliseBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

const unique = (values: readonly string[]) => new Set(values).size === values.length;

const ApiKey = z.string().trim().min(8, 'API keys are longer than this').max(400);

export const AiSettingsUpdate = z.object({
  version: z.number().int().min(0),
  enabled: z.boolean(),
  provider: z.enum(AI_PROVIDERS),
  model: ModelId,
  baseUrl: z.string().trim().max(300).default(''),
  // Omitted: keep. null: remove. A string: replace (write-only).
  apiKey: ApiKey.nullable().optional(),
  allowedRoles: z
    .array(z.enum(ROLE_NAMES as [RoleName, ...RoleName[]]))
    .max(ROLE_NAMES.length)
    .refine(unique, 'Each role once'),
  shareEnquiryDetails: z.object({ enabled: z.boolean(), acknowledge: z.boolean().optional() }).optional(),
  systemPrompt: z.string().trim().max(2000).default(''),
  maxOutputTokens: z.number().int().min(OUTPUT_TOKENS.min).max(OUTPUT_TOKENS.max),
});
export type AiSettingsUpdate = z.infer<typeof AiSettingsUpdate>;

export const ListModelsInput = z.object({
  provider: z.enum(AI_PROVIDERS),
  baseUrl: z.string().trim().max(300).default(''),
  apiKey: ApiKey.optional(),
});
export type ListModelsInput = z.infer<typeof ListModelsInput>;

// V9-R10: the editable "pages" are the `page.*` globals.
export const PAGE_KEYS = [
  'page.home',
  'page.services',
  'page.our-work',
  'page.insurance',
  'page.about',
  'page.process',
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

// The admin paths the assistant accepts as context (also checked in the browser).
export const CHAT_PATH = /^\/dashboard(\/[A-Za-z0-9._~%/-]*)?$/;

// Where in the admin the person is. Ids only: the server looks the title up
// with the person's own permissions, and nothing else from the screen is sent.
export const ChatContext = z.object({
  path: z.string().max(200).regex(CHAT_PATH, 'Use a dashboard path'),
  entity: z.object({ type: z.literal('page'), key: z.enum(PAGE_KEYS) }).optional(),
});
export type ChatContext = z.infer<typeof ChatContext>;

// The browser sends the new text only; history is the server's.
// Two variations on that: `regenerate` re-runs the last turn (no text), and
// `editMessageId` replaces one of the person's own messages and what follows.
export const ChatInput = z
  .object({
    conversationId: z.uuid().nullable().optional(),
    text: z.string().trim().min(1, 'Type a message').max(MAX_INPUT_CHARS).optional(),
    regenerate: z.literal(true).optional(),
    editMessageId: z.uuid().optional(),
    context: ChatContext.optional(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (v.regenerate) {
      if (!v.conversationId) issue('conversationId', 'Pick a conversation to regenerate');
      if (v.text !== undefined) issue('text', 'Regenerate takes no text');
      if (v.editMessageId) issue('editMessageId', 'Edit or regenerate, not both');
      return;
    }
    if (v.text === undefined) issue('text', 'Type a message');
    if (v.editMessageId && !v.conversationId) issue('conversationId', 'Pick a conversation to edit');
  });
export type ChatInput = z.infer<typeof ChatInput>;

export const ConversationParam = z.object({ id: z.uuid() });
