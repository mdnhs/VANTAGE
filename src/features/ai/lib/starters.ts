import {
  ChartColumnIcon,
  FileTextIcon,
  HeadingIcon,
  HeartHandshakeIcon,
  InboxIcon,
  MessageSquareTextIcon,
  SearchCheckIcon,
  type LucideIcon,
} from 'lucide-react';

import type { AssistantScreen } from './route-context';

// A card fills the composer and focuses it; it never sends. The generic set
// leaves two prompts for the person to finish. The page set says "this page":
// the server names it for the model.
export type Starter = { icon: LucideIcon; title: string; description: string };

export const STARTERS: Record<AssistantScreen, Starter[]> = {
  default: [
    { icon: FileTextIcon, title: 'Write a meta description for…', description: 'About 150 characters, ready to paste' },
    {
      icon: HeartHandshakeIcon,
      title: 'Rewrite this paragraph to sound friendlier: …',
      description: 'Paste a paragraph after the colon',
    },
    { icon: SearchCheckIcon, title: 'Which pages need SEO work?', description: 'Checks the SEO health for gaps' },
    {
      icon: InboxIcon,
      title: "Summarise this week's quote requests",
      description: 'Counts by status and service',
    },
  ],
  page: [
    {
      icon: HeadingIcon,
      title: 'Suggest a better hero headline for this page',
      description: 'Three options in plain language',
    },
    {
      icon: FileTextIcon,
      title: 'Write a meta description for this page',
      description: 'About 150 characters, from the page text',
    },
    {
      icon: SearchCheckIcon,
      title: 'Check this page for spelling and tone',
      description: 'Irish English, friendly and clear',
    },
    {
      icon: MessageSquareTextIcon,
      title: 'Summarise this page in two sentences',
      description: 'Handy for sharing and snippets',
    },
  ],
  enquiries: [
    { icon: InboxIcon, title: 'How many quotes came in this week?', description: 'Counts by status' },
    {
      icon: ChartColumnIcon,
      title: 'Which services are people asking about most?',
      description: 'Quote services, busiest first',
    },
    {
      icon: SearchCheckIcon,
      title: 'How many contact messages are still new?',
      description: 'Contact message numbers',
    },
    {
      icon: MessageSquareTextIcon,
      title: "Compare this month's quotes with last month",
      description: 'Week by week',
    },
  ],
};
