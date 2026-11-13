import { AlertTriangle, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Info, Lightbulb } from 'lucide-react';
import Link from 'next/link';

import { LINK_SECONDARY } from '@/components/admin/dashboard/page-header';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import type { RoleName } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

import { SHORTCUTS } from '../docs';
import {
  canFollow,
  groupedArticles,
  HELP_GROUPS,
  HELP_HREF,
  headingId,
  helpArticle,
  helpHref,
  neighbours,
  tocFor,
  type HelpArticle,
  type HelpBlock,
} from '../registry';
import type { OwnerContact } from '../types';
import { HELP_GROUP_ICONS } from './help-icons';
import { HelpMobileNav } from './help-mobile-nav';
import { HelpSidebar, type HelpNavGroup } from './help-sidebar';
import { HelpToc, HelpTocDisclosure } from './help-toc';
import { HelpText } from './inline';

function navGroups(roles: readonly RoleName[]): HelpNavGroup[] {
  return groupedArticles(roles).map((group) => ({
    id: group.id,
    label: group.label,
    articles: group.articles.map(({ slug, title }) => ({ slug, title })),
  }));
}

// Three columns like a docs site: topics (~17rem), the page, and "On this
// page" (~14rem). HelpShell (the topics) is rendered by help/layout.tsx, so
// it stays mounted across articles; each page brings its own TOC column.
// The side columns stick, with their own scroll, while <main> scrolls.
export function HelpShell({ roles, children }: { roles: readonly RoleName[]; children: React.ReactNode }) {
  const groups = navGroups(roles);
  return (
    <div data-testid='help' className='grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]'>
      <aside className='sticky top-0 hidden max-h-(--content-h) self-start overflow-y-auto overscroll-contain pr-2 pb-6 lg:block'>
        <HelpSidebar groups={groups} />
      </aside>
      <div className='flex min-w-0 flex-col gap-6'>
        <HelpMobileNav groups={groups} />
        {children}
      </div>
    </div>
  );
}

function HelpPage({ aside, children }: { aside?: React.ReactNode; children: React.ReactNode }) {
  if (!aside) return <>{children}</>;
  return (
    <div className='grid gap-8 xl:grid-cols-[minmax(0,1fr)_14rem]'>
      <div className='min-w-0'>{children}</div>
      <aside className='sticky top-0 hidden max-h-(--content-h) self-start overflow-y-auto pb-6 xl:block'>
        {aside}
      </aside>
    </div>
  );
}

const CALLOUT = {
  tip: { label: 'Tip', Icon: Lightbulb, tone: 'border-primary/30 bg-accent/60' },
  note: { label: 'Note', Icon: Info, tone: 'border-border bg-card' },
  warning: { label: 'Warning', Icon: AlertTriangle, tone: 'border-destructive/40 bg-destructive/5' },
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

function Shortcuts() {
  return (
    <dl className='flex flex-col divide-y divide-border rounded-xl border bg-card text-sm'>
      {SHORTCUTS.map(({ keys, action }) => (
        <div key={action} className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3'>
          <dt className='font-medium text-foreground'>{action}</dt>
          <dd className='flex flex-wrap items-center gap-1.5'>
            {keys.map((combo, index) => (
              <span key={combo.join('+')} className='flex items-center gap-1.5'>
                {index > 0 ? <span className='text-xs text-muted-foreground'>or</span> : null}
                <KbdGroup>
                  {combo.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Owners({ owners }: { owners: readonly OwnerContact[] }) {
  if (owners.length === 0) {
    return (
      <p className='leading-7 text-muted-foreground'>There is no active owner yet. Ask whoever set up the site.</p>
    );
  }
  return (
    <ul className='flex flex-col gap-3 text-sm'>
      {owners.map((owner) => (
        <li key={owner.email} className='flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3'>
          <span
            aria-hidden
            className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'
          >
            {initials(owner.name)}
          </span>
          <span className='flex min-w-0 flex-col'>
            <span className='font-semibold text-foreground'>{owner.name}</span>
            <a
              href={`mailto:${owner.email}`}
              className='inline-flex w-fit max-w-full items-center text-primary underline-offset-4 hover:underline pointer-coarse:min-h-11'
            >
              <span className='truncate'>{owner.email}</span>
            </a>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Block({
  block,
  roles,
  owners,
}: {
  block: HelpBlock;
  roles: readonly RoleName[];
  owners: readonly OwnerContact[];
}) {
  switch (block.type) {
    case 'p':
      return (
        <p className='leading-7 text-muted-foreground'>
          <HelpText text={block.text} roles={roles} />
        </p>
      );
    case 'list':
      return (
        <ul className='ml-5 flex list-disc flex-col gap-2 leading-7 text-muted-foreground marker:text-primary'>
          {block.items.map((item) => (
            <li key={item}>
              <HelpText text={item} roles={roles} />
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className='flex flex-col gap-3'>
          {block.items.map((item, index) => (
            <li key={item} className='flex gap-3 leading-7 text-muted-foreground'>
              <span
                aria-hidden
                className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums'
              >
                {index + 1}
              </span>
              <span className='min-w-0'>
                <HelpText text={item} roles={roles} />
              </span>
            </li>
          ))}
        </ol>
      );
    case 'callout': {
      const { label, Icon, tone } = CALLOUT[block.tone];
      return (
        <div role='note' aria-label={label} className={cn('flex gap-3 rounded-xl border p-4 leading-7', tone)}>
          <Icon aria-hidden className='mt-1 size-4 shrink-0 text-primary' />
          <p className='min-w-0 text-foreground/90'>
            <span className='font-semibold'>{label}: </span>
            <HelpText text={block.text} roles={roles} />
          </p>
        </div>
      );
    }
    case 'open':
      // A button to a screen the viewer cannot open is left out.
      return canFollow(roles, block.href) ? (
        <p>
          <Link href={block.href} className={cn(LINK_SECONDARY, 'h-11')}>
            {block.label}
            <ArrowUpRight aria-hidden />
          </Link>
        </p>
      ) : null;
    case 'shortcuts':
      return <Shortcuts />;
    case 'owners':
      return <Owners owners={owners} />;
  }
}

function groupLabel(article: HelpArticle) {
  return HELP_GROUPS.find((group) => group.id === article.group)!.label;
}

export function HelpArticleView({
  article,
  roles,
  owners = [],
}: {
  article: HelpArticle;
  roles: readonly RoleName[];
  owners?: readonly OwnerContact[];
}) {
  const { prev, next } = neighbours(roles, article.slug);
  const toc = tocFor(article);
  return (
    <HelpPage aside={<HelpToc entries={toc} />}>
      <article className='flex max-w-[70ch] flex-col gap-10'>
        <header className='flex flex-col gap-3'>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={HELP_HREF} />}>Help</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{groupLabel(article)}</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{article.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className='text-title font-semibold text-balance'>{article.title}</h1>
          <p className='text-lg leading-8 text-muted-foreground'>
            <HelpText text={article.lead} roles={roles} />
          </p>
        </header>
        <HelpTocDisclosure entries={toc} />
        {article.sections.map((section) => {
          const id = headingId(section.title);
          return (
            <section
              key={id}
              aria-labelledby={id}
              className={cn('flex flex-col gap-4', section.level === 3 && '-mt-4')}
            >
              {section.level === 3 ? (
                <h3 id={id} className='scroll-mt-6 text-lg font-semibold tracking-tight'>
                  {section.title}
                </h3>
              ) : (
                <h2 id={id} className='scroll-mt-6 border-b border-border pb-2 text-xl font-semibold tracking-tight'>
                  {section.title}
                </h2>
              )}
              {section.blocks.map((block, index) => (
                <Block key={index} block={block} roles={roles} owners={owners} />
              ))}
            </section>
          );
        })}
        <nav aria-label='Pagination' className='flex items-start justify-between gap-6 border-t border-border py-8'>
          {prev ? <PagerLink article={prev} direction='prev' /> : <span aria-hidden />}
          {next ? <PagerLink article={next} direction='next' /> : <span aria-hidden />}
        </nav>
      </article>
    </HelpPage>
  );
}

// Previous / Next in sidebar order, across groups: a chevron, a small label
// and the title, no box. The chevron nudges outward on hover.
function PagerLink({ article, direction }: { article: HelpArticle; direction: 'prev' | 'next' }) {
  const isNext = direction === 'next';
  const Chevron = isNext ? ChevronRight : ChevronLeft;
  return (
    <Link
      href={helpHref(article.slug)}
      rel={direction}
      className={cn('group flex min-w-0 items-center gap-3', isNext && 'ml-auto flex-row-reverse text-right')}
    >
      <Chevron
        aria-hidden
        className={cn(
          'size-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none',
          isNext ? 'group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5',
        )}
      />
      <span className='flex min-w-0 flex-col gap-0.5'>
        <span className='text-xs text-muted-foreground'>{isNext ? 'Next' : 'Previous'}</span>{' '}
        <span className='font-semibold text-foreground underline-offset-4 group-hover:text-primary group-hover:underline'>
          {article.title}
        </span>
      </span>
    </Link>
  );
}

export function HelpOverview({ roles }: { roles: readonly RoleName[] }) {
  const start = helpArticle('getting-started')!;
  const groups = groupedArticles(roles);
  return (
    <div className='flex flex-col gap-8'>
      <header className='flex max-w-3xl flex-col gap-3'>
        <h1 className='text-title font-semibold text-balance'>Help</h1>
        <p className='text-lg leading-8 text-muted-foreground'>
          Step-by-step guides for every part of the admin. Only the parts your role can open are listed.
        </p>
      </header>
      <Link
        href={helpHref(start.slug)}
        className='flex flex-col gap-2 rounded-card bg-primary p-6 text-primary-foreground transition-opacity hover:opacity-95 sm:p-8'
      >
        <span className='text-sm font-semibold tracking-wide uppercase opacity-80'>New here?</span>
        <span className='text-2xl font-semibold'>{start.title}</span>
        <span className='max-w-2xl opacity-90'>{start.description}</span>
        <span className='mt-2 inline-flex items-center gap-1 font-semibold'>
          Read the guide <ArrowRight aria-hidden className='size-4' />
        </span>
      </Link>
      <div className='grid gap-4 md:grid-cols-2 2xl:grid-cols-3'>
        {groups.map((group) => {
          const Icon = HELP_GROUP_ICONS[group.id];
          return (
            <section
              key={group.id}
              aria-labelledby={`group-${group.id}`}
              className='flex flex-col gap-4 rounded-card bg-card p-5 text-card-foreground sm:p-6'
            >
              <div className='flex items-center gap-3'>
                <span
                  aria-hidden
                  className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-5'
                >
                  <Icon />
                </span>
                <div className='min-w-0'>
                  <h2 id={`group-${group.id}`} className='font-semibold'>
                    {group.label}
                  </h2>
                  <p className='text-sm text-muted-foreground'>{group.description}</p>
                </div>
              </div>
              <ul className='flex flex-col gap-1'>
                {group.articles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={helpHref(article.slug)}
                      className='group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground'
                    >
                      {article.title}
                      <ArrowRight aria-hidden className='size-4 opacity-0 transition-opacity group-hover:opacity-100' />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
