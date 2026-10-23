import 'server-only';

import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogle } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';

import { baseUrlProblem, normaliseBaseUrl, type AiProvider } from '@/lib/ai/schema';
import { serverEnv } from '@/lib/env';
import { ApiError, ERROR_CODES } from '@/server/lib/errors';
import { fetchFor } from '@/server/lib/net/safe-fetch';

export type ModelSettings = {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiKey: string | null;
};

// V9-R6: never in production, whatever the flag says.
export const mockEnabled = (): boolean =>
  serverEnv().AI_PROVIDER_MOCK === true && process.env.NODE_ENV !== 'production';
export const localHttpAllowed = (): boolean => process.env.NODE_ENV === 'development';

const notSetUp = () =>
  ApiError.serviceUnavailable(
    "The AI assistant isn't set up yet. An owner or admin can add an API key in AI assistant settings.",
  );

// MK R6: a provider address may not bounce a request somewhere else (an https
// host answering 302 to http://169.254.169.254 would skip the address guard).
const noRedirectFetch: typeof fetch = (url, init) => globalThis.fetch(url, { ...init, redirect: 'error' });

// Building a model makes no network call; the first request does.
export function buildModel(s: ModelSettings): LanguageModel {
  switch (s.provider) {
    case 'google':
      if (!s.apiKey) throw notSetUp();
      return createGoogle({ apiKey: s.apiKey, fetch: noRedirectFetch })(s.model);
    case 'anthropic':
      if (!s.apiKey) throw notSetUp();
      return createAnthropic({ apiKey: s.apiKey, fetch: noRedirectFetch })(s.model);
    case 'openai-compatible': {
      const problem = baseUrlProblem(s.baseUrl, localHttpAllowed());
      if (problem) {
        throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', 422, { baseUrl: [problem] });
      }
      return createOpenAICompatible({
        name: 'custom',
        baseURL: normaliseBaseUrl(s.baseUrl),
        apiKey: s.apiKey ?? undefined,
        includeUsage: true,
        // MK R6: also refuse hosts whose DNS answer is a private address.
        fetch: fetchFor(localHttpAllowed()),
      })(s.model);
    }
  }
}

export async function getModel(s: ModelSettings): Promise<LanguageModel> {
  if (mockEnabled()) {
    const { mockModel } = await import('./mock-model');
    return mockModel(s.model || 'mock-model');
  }
  return buildModel(s);
}
