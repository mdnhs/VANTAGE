import {
  BookOpen,
  CircleHelp,
  Globe,
  Image as ImageIcon,
  Inbox,
  SearchCheck,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { HelpGroupId } from '../types';

// One icon per docs group, matching the admin sidebar's icon for that area.
export const HELP_GROUP_ICONS: Record<HelpGroupId, LucideIcon> = {
  start: BookOpen,
  website: Globe,
  media: ImageIcon,
  inbox: Inbox,
  growth: SearchCheck,
  settings: Settings,
  team: Users,
  faq: CircleHelp,
};
