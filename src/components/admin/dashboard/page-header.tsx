import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Page title row actions. Everything in that row is one height (h-9) so a
// primary button, outline tools, icon buttons and count chips line up.
export const PRIMARY_ACTION = 'h-9 gap-1.5 rounded-lg px-3.5 text-sm font-semibold';
export const SECONDARY_ACTION =
  'h-9 gap-1.5 rounded-lg border-primary px-3.5 text-sm font-semibold text-primary hover:bg-accent hover:text-accent-foreground';
// Plain outline/ghost tools in the same row (Export CSV, Call, Email...).
export const TOOLBAR_ACTION = "h-9 gap-1.5 rounded-lg px-3 text-sm font-medium [&_svg:not([class*='size-'])]:size-4";
export const TOOLBAR_ICON = 'size-9 rounded-lg';
// Read-only count shown in the row ("7 total", "2 new").
export const TOOLBAR_CHIP =
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground tabular-nums';
// A form's own submit button, and anything sitting beside one.
export const FORM_ACTION = 'h-11 rounded-xl px-5 font-semibold';

// Navigation styled as buttons stays a real link (role "link"), unlike
// Base UI's Button rendered as an anchor (nativeButton={false}), which
// announces as a button. The admin's one pattern for button-looking links.
// cn() so the action classes win over the variant's (border-primary over
// the outline's border-border), as Button itself merges them.
export const LINK_PRIMARY = cn(buttonVariants(), PRIMARY_ACTION);
export const LINK_SECONDARY = cn(buttonVariants({ variant: 'outline' }), SECONDARY_ACTION);
export const LINK_FORM = cn(buttonVariants(), FORM_ACTION);

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  titleTestId,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  titleTestId?: string;
}) {
  return (
    <header className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
      <div className='flex min-w-0 flex-col gap-2'>
        {breadcrumbs}
        <h1 className='text-title text-balance' data-testid={titleTestId}>
          {title}
        </h1>
        {description ? <p className='text-sm text-muted-foreground'>{description}</p> : null}
      </div>
      {actions ? <div className='flex flex-wrap items-center gap-2'>{actions}</div> : null}
    </header>
  );
}
