// "Looked at: …" fallbacks when a tool result carries no label (isomorphic).
export const TOOL_LABELS = {
  searchContent: 'a search of the site',
  getPage: 'a page',
  getSeoHealth: 'SEO health',
  getDashboardSummary: 'the dashboard',
  getQuoteStats: 'quote numbers',
  getQuoteRequest: 'a quote request',
  getContactStats: 'contact message numbers',
} as const;
export type ToolName = keyof typeof TOOL_LABELS;
