import {
  BellIcon,
  BotIcon,
  BracesIcon,
  BuildingIcon,
  CircleHelpIcon,
  CookieIcon,
  FileTextIcon,
  GlobeIcon,
  HistoryIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  InfoIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  ListTreeIcon,
  MailIcon,
  MegaphoneIcon,
  MenuIcon,
  MessageSquareTextIcon,
  MessagesSquareIcon,
  PaletteIcon,
  PanelBottomIcon,
  PhoneIcon,
  ScaleIcon,
  SearchCheckIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextCursorInputIcon,
  TrendingUpIcon,
  UsersIcon,
  WrenchIcon,
  ArrowRightLeftIcon,
  CameraIcon,
  type LucideIcon,
} from 'lucide-react';

// Icons live with the UI; lib/admin/nav.ts stays free of React. Keyed by the
// nav registry's ids: sections (sidebar) and their sub-pages (section rail).
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

  // Website
  'website-home': HomeIcon,
  'website-services': WrenchIcon,
  'website-legal-pages': ScaleIcon,
  'website-work': CameraIcon,
  'website-insurance': ShieldIcon,
  'website-about': InfoIcon,
  'website-process': ListOrderedIcon,
  'website-contact': PhoneIcon,

  // Enquiries
  'enquiries-quotes': FileTextIcon,
  'enquiries-contacts': MailIcon,

  // SEO
  'seo-overview': TrendingUpIcon,
  'seo-defaults': SlidersHorizontalIcon,
  'seo-redirects': ArrowRightLeftIcon,

  // Marketing
  'marketing-tracking': SearchCheckIcon,
  'marketing-consent': CookieIcon,
  'marketing-events': ListTreeIcon,
  'marketing-code': BracesIcon,

  // Site settings
  'settings-identity': BuildingIcon,
  'settings-contact': PhoneIcon,
  'settings-navigation': MenuIcon,
  'settings-footer': PanelBottomIcon,
  'settings-forms': TextCursorInputIcon,
  'settings-notifications': BellIcon,
  'settings-privacy': ShieldCheckIcon,
  'settings-live-chat-ai': MessageSquareTextIcon,
  'settings-ai-assistant': BotIcon,
};

// Fallback for a sub-page added without an icon.
export const NAV_ICON_FALLBACK: LucideIcon = SparklesIcon;
