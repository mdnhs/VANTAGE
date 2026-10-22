import 'server-only';

import { tool, type ToolSet } from 'ai';
import * as z from 'zod';

import { PAGE_KEYS } from '@/lib/ai/schema';
import { hasPermission } from '@/lib/auth/permissions';
import type { Actor } from '@/server/lib/auth/actor';

import { errorTag, ToolFailure } from './errors';
import type { AiStored } from './settings';
import {
  contactStats,
  dashboardSummary,
  ENQUIRY_RANGES,
  quoteRequest,
  quoteStats,
  readPage,
  searchContent,
  seoHealth,
  type EnquiryRange,
  type ToolResult,
} from './tool-data';

// A failing lookup reaches the model and the sheet as one generic message; the
// server log keeps the tool name and error class/code, never the text.
function guard<I>(name: string, run: (input: I) => Promise<ToolResult>): (input: I) => Promise<ToolResult> {
  return async (input) => {
    try {
      return await run(input);
    } catch (error) {
      console.error(`[ai] tool ${name} failed`, errorTag(error));
      throw new ToolFailure(name);
    }
  };
}

const RangeInput = z.object({
  range: z.enum(Object.keys(ENQUIRY_RANGES) as [EnquiryRange, ...EnquiryRange[]]).default('30d'),
});

// Read-only, run with the requesting person's actor, and only the tools their
// role could use are offered at all.
export function buildTools({ actor, settings }: { actor: Actor; settings: AiStored }): ToolSet {
  const can = (p: Parameters<typeof hasPermission>[1]) => hasPermission(actor.roles, p);
  const tools: ToolSet = {};
  if (can({ page: ['read'] }) || can({ content: ['read'] })) {
    tools.searchContent = tool({
      description:
        "Search the site's pages, services and projects by words in the title or text. Returns titles, status and a short snippet.",
      inputSchema: z.object({ query: z.string().trim().min(2).max(100) }),
      execute: guard('searchContent', ({ query }: { query: string }) => searchContent(actor, query)),
    });
  }
  if (can({ page: ['read'] })) {
    tools.getPage = tool({
      description: 'Read one website page by its key (for example page.about): its text, up to 8 000 characters.',
      inputSchema: z.object({ key: z.enum(PAGE_KEYS) }),
      execute: guard('getPage', ({ key }: { key: (typeof PAGE_KEYS)[number] }) => readPage(actor, key)),
    });
  }
  if (can({ seo: ['read'] })) {
    tools.getSeoHealth = tool({
      description: "Get the site's SEO health score and the list of SEO issues.",
      inputSchema: z.object({}),
      execute: guard('getSeoHealth', () => seoHealth(actor)),
    });
  }
  if (can({ dashboard: ['view'] })) {
    tools.getDashboardSummary = tool({
      description: "Get the dashboard's key numbers for this person's role: quote requests and jobs.",
      inputSchema: z.object({}),
      execute: guard('getDashboardSummary', () => dashboardSummary(actor)),
    });
  }
  tools.getQuoteStats = tool({
    description:
      'Count quote requests by status, service type, week and source for a period. Personal details are never included unless the owner allowed it.',
    inputSchema: RangeInput,
    execute: guard('getQuoteStats', ({ range }: { range: EnquiryRange }) => quoteStats(actor, settings, range)),
  });
  tools.getContactStats = tool({
    description:
      'Count contact messages by status, service, week and source for a period. Personal details are never included unless the owner allowed it.',
    inputSchema: RangeInput,
    execute: guard('getContactStats', ({ range }: { range: EnquiryRange }) => contactStats(actor, settings, range)),
  });
  if (settings.shareEnquiryDetails.enabled && can({ quote: ['read'] })) {
    tools.getQuoteRequest = tool({
      description:
        'Read one quote request by id: first name, service, vehicle, status, date and the description. No contact details.',
      inputSchema: z.object({ id: z.uuid() }),
      execute: guard('getQuoteRequest', ({ id }: { id: string }) => quoteRequest(actor, settings, id)),
    });
  }
  return tools;
}
