import {
  CircleHelpIcon,
  GlobeIcon,
  HistoryIcon,
  ImageIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  PaletteIcon,
  SearchCheckIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

// Icons live with the UI; lib/admin/nav.ts stays free of React.
export const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboardIcon,
  website: GlobeIcon,
  media: ImageIcon,
  enquiries: InboxIcon,
  support: MessagesSquareIcon,
  seo: SearchCheckIcon,
  marketing: MegaphoneIcon,
  appearance: PaletteIcon,
  settings: SettingsIcon,
  users: UsersIcon,
  activity: HistoryIcon,
  help: CircleHelpIcon,
};
