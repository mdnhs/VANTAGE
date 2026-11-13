import type { Permissions } from '@/lib/auth/permissions';

// The admin's own help docs (/dashboard/help). Plain data, no React, so the
// tests read the same registry the pages render.
//
// Inline text uses a tiny markup, rendered by components/inline.tsx:
//   **Exact UI label**                bold
//   `⌘K`                              a keyboard hint
//   [Open Media →](/dashboard/media)  a link (admin screens or /dashboard/help/<slug>)

export type OwnerContact = { name: string; email: string };

export type HelpGroupId = 'start' | 'website' | 'media' | 'inbox' | 'growth' | 'settings' | 'team' | 'faq';

export type HelpBlock =
  | { type: 'p'; text: string }
  | { type: 'steps'; items: readonly string[] }
  | { type: 'list'; items: readonly string[] }
  | { type: 'callout'; tone: 'tip' | 'note' | 'warning'; text: string }
  // A button-style link to the admin screen the article is about.
  | { type: 'open'; href: string; label: string }
  // The keyboard shortcuts table.
  | { type: 'shortcuts' }
  // The site's owners, read from the database when the page renders.
  | { type: 'owners' };

export type HelpSection = {
  title: string;
  // 3: a sub-heading (h3) under the section before it. Default 2 (h2).
  level?: 2 | 3;
  blocks: readonly HelpBlock[];
};

export type HelpArticle = {
  slug: string;
  title: string;
  group: HelpGroupId;
  // One line for the overview cards and search.
  description: string;
  // The paragraph under the title.
  lead: string;
  // Who can open the screens this article is about. Omitted: everyone.
  permission?: Permissions;
  keywords?: readonly string[];
  sections: readonly HelpSection[];
};

export type Shortcut = { keys: string[][]; action: string };
