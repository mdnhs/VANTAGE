import type { HelpArticle, Shortcut } from '../types';
import { FAQ_DOCS } from './faq';
import { GROWTH_DOCS } from './growth';
import { INBOX_DOCS } from './inbox';
import { MEDIA_DOCS } from './media';
import { SETTINGS_DOCS } from './settings';
import { START_DOCS } from './start';
import { TEAM_DOCS } from './team';
import { WEBSITE_DOCS } from './website';

// ⌘ on a Mac, Ctrl elsewhere: both are listed (the page renders on the server).
export const SHORTCUTS: readonly Shortcut[] = [
  {
    keys: [
      ['⌘', 'K'],
      ['Ctrl', 'K'],
    ],
    action: 'Search and go to any screen',
  },
  { keys: [['Esc']], action: 'Close a panel or dialog' },
];

// Plain-language guides for the people who run the Auto Paint Shop website,
// one file per group. Each article names screens by their exact UI label.
export const HELP_DOCS: readonly HelpArticle[] = [
  ...START_DOCS,
  ...WEBSITE_DOCS,
  ...MEDIA_DOCS,
  ...INBOX_DOCS,
  ...GROWTH_DOCS,
  ...SETTINGS_DOCS,
  ...TEAM_DOCS,
  ...FAQ_DOCS,
];
