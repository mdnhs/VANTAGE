'use client';

import {
  Activity,
  AlertTriangle,
  AtSign,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock,
  Contrast,
  Eye,
  FileText,
  FlaskConical,
  Gauge,
  Handshake,
  Heading,
  HeartPulse,
  HelpCircle,
  History,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  LayoutList,
  Link2,
  ListChecks,
  ListOrdered,
  ListTodo,
  MapPin,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  MousePointerClick,
  Palette,
  PanelBottom,
  PanelTop,
  Phone,
  PieChart,
  Quote,
  Reply,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  TextCursorInput,
  Trash2,
  TrendingUp,
  Type,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { createElement, useId, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

// A card's icon, picked from words in its title so every card gets one without
// listing them one by one. The first match wins, so the specific patterns come
// before the general ones; anything unmatched gets a neutral list icon.
const ICONS: ReadonlyArray<readonly [RegExp, LucideIcon]> = [
  // Account and security
  [/password|security/i, KeyRound],
  [/two-factor|2fa/i, ShieldCheck],
  [/device|session/i, MonitorSmartphone],
  [/profile(?!s)/i, UserRound],
  // Look and feel
  [/colou?r|appearance|palette|theme/i, Palette],
  [/font/i, Type],
  [/contrast/i, Contrast],
  [/preview/i, Eye],
  [/history|activity/i, History],
  // SEO and reporting
  [/alt text/i, ImageIcon],
  [/checks/i, ListChecks],
  [/issue/i, AlertTriangle],
  [/health/i, HeartPulse],
  [/seo|search|crawler|sitemap/i, Search],
  [/test/i, FlaskConical],
  [/status/i, Activity],
  [/channel/i, PieChart],
  [/trend|monthly/i, TrendingUp],
  [/week/i, BarChart3],
  [/next up|to do|todo/i, ListTodo],
  // Content records
  [/catalog/i, LayoutGrid],
  [/partner/i, Handshake],
  [/project|our work/i, Camera],
  [/service/i, Wrench],
  // Settings and page sections
  [/phone|email|contact/i, Phone],
  [/address|map|visit|location/i, MapPin],
  [/hour|opening/i, Clock],
  [/logo|icon|image|photo|picture|gallery/i, ImageIcon],
  [/social|shar(e|ing)/i, Share2],
  [/menu|navigation/i, Menu],
  [/link/i, Link2],
  [/button|call to action|cta/i, MousePointerClick],
  [/bottom bar|footer/i, PanelBottom],
  [/banner|hero|top/i, PanelTop],
  [/heading|title/i, Heading],
  [/field/i, TextCursorInput],
  [/reassurance|standard|trust|why|matching|consent/i, ShieldCheck],
  [/after sending|success/i, CheckCircle2],
  [/auto-reply|reply/i, Reply],
  [/recipient|notification/i, Bell],
  [/assistant|\bai\b|memory/i, Bot],
  [/limit/i, Gauge],
  [/spam|retention|keep|privacy/i, Trash2],
  [/enquir|message|chat/i, MessageSquare],
  [/team|people|staff/i, Users],
  [/faq|question/i, HelpCircle],
  [/step|process|claim/i, ListOrdered],
  [/review|testimonial|rating/i, Star],
  [/quote|story/i, Quote],
  [/business|brand|company|identity/i, Building2],
  [/schedule|date|holiday/i, CalendarClock],
  [/microcopy|text|note|print|copy|content|page|details/i, FileText],
  [/handle|@/i, AtSign],
  [/feature|highlight|number|figure/i, Sparkles],
];

export function sectionIcon(title: string): LucideIcon {
  return ICONS.find(([pattern]) => pattern.test(title))?.[1] ?? LayoutList;
}

// The icon chip at the start of every card header in the admin.
export function CardIcon({ title, icon, small = false }: { title: string; icon?: LucideIcon; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-lg bg-primary/10 text-primary',
        small ? 'size-7 [&_svg]:size-4' : 'size-9 [&_svg]:size-[18px]',
      )}
    >
      {createElement(icon ?? sectionIcon(title))}
    </span>
  );
}

// One titled card for a group of fields or a panel of content: an icon chip,
// the title and an optional line of help, an optional action on the right,
// then the body. `@container` lets fields inside pick one or two columns from
// the card's own width, so the same form works full-width and squeezed beside
// a live preview.
export function SectionCard({
  title,
  description,
  titleId,
  icon,
  action,
  children,
  nested = false,
  bodyClassName,
  className,
  ...props
}: {
  title: string;
  description?: ReactNode;
  titleId?: string;
  // Overrides the icon picked from the title.
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  // Inside another card: a quieter box (no fill or shadow, smaller chip) so cards don't stack.
  nested?: boolean;
  bodyClassName?: string;
} & Omit<ComponentProps<'section'>, 'title'>) {
  const ownId = useId();
  const headingId = titleId ?? ownId;
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        '@container flex min-w-0 scroll-mt-4 flex-col border',
        nested ? 'rounded-xl bg-muted/30' : 'rounded-card bg-card text-card-foreground shadow-xs',
        className,
      )}
      {...props}
    >
      <header className={cn('flex items-start gap-3 border-b', nested ? 'px-4 py-3' : 'px-4 py-3.5 sm:px-5')}>
        <CardIcon title={title} icon={icon} small={nested} />
        <div className='flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5'>
          <h3 id={headingId} className={cn('leading-6 font-semibold', nested ? 'text-sm' : 'text-base')}>
            {title}
          </h3>
          {description ? <div className='text-sm text-muted-foreground'>{description}</div> : null}
        </div>
        {action ? <div className='shrink-0'>{action}</div> : null}
      </header>
      <div className={cn(nested ? 'p-4' : 'p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
