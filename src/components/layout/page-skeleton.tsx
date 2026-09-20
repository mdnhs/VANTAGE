import { Skeleton } from '@/components/ui/skeleton';

// Page title + description placeholder shared by every dashboard skeleton.
function HeaderSkeleton() {
  return (
    <div className='flex items-center justify-between gap-4'>
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-4 w-72 max-w-full' />
      </div>
      <Skeleton className='h-9 w-28' />
    </div>
  );
}

// Form-style page: a few cards of labelled inputs (site pages, settings).
export function FormPageSkeleton() {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <HeaderSkeleton />
      {[0, 1].map((card) => (
        <div key={card} className='flex flex-col gap-4 rounded-xl border border-border p-6'>
          <Skeleton className='h-5 w-40' />
          <div className='grid gap-4 sm:grid-cols-2'>
            {[0, 1, 2, 3].map((field) => (
              <div key={field} className='flex flex-col gap-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-9 w-full' />
              </div>
            ))}
          </div>
          <Skeleton className='h-20 w-full' />
        </div>
      ))}
    </div>
  );
}

// List page: header + table rows (services, projects, quotes, contacts, admins).
export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <HeaderSkeleton />
      <div className='overflow-hidden rounded-lg border border-border'>
        <Skeleton className='h-10 w-full rounded-none' />
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className='flex items-center gap-4 border-t border-border px-4 py-3'>
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-5 flex-1' />
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-5 w-12' />
          </div>
        ))}
      </div>
    </div>
  );
}

// Site settings: title, a vertical tab list on the left (5 sections) and one form card on the
// right — mirrors SettingsTabs so the layout doesn't jump when the real page streams in.
export function SettingsPageSkeleton() {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-6 w-36' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>

      <div className='flex items-start gap-6'>
        <div className='flex w-48 shrink-0 flex-col gap-1'>
          {[0, 1, 2, 3, 4].map((tab) => (
            <Skeleton key={tab} className={tab === 0 ? 'h-8 w-full' : 'h-8 w-4/5'} />
          ))}
        </div>

        <div className='flex min-w-0 flex-1 flex-col gap-5 rounded-xl border border-border p-6'>
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-4 w-72 max-w-full' />
          </div>
          {[0, 1, 2].map((field) => (
            <div key={field} className='flex flex-col gap-2'>
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-9 w-full' />
            </div>
          ))}
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-20 w-full' />
          </div>
          <Skeleton className='h-9 w-24' />
        </div>
      </div>
    </div>
  );
}

// Website-page editors (home, services, our work, insurance, about, process): title, a
// horizontal tab row, then stacked form cards — mirrors SectionTabs / HomePageTabs.
export function TabbedPageSkeleton({ tabs = 6 }: { tabs?: number }) {
  return (
    <div className='flex flex-col gap-6' aria-busy='true' aria-label='Loading'>
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-6 w-36' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>

      <div className='flex flex-col gap-6'>
        <div className='flex gap-2 border-b border-border pb-2'>
          {Array.from({ length: tabs }, (_, tab) => (
            <Skeleton key={tab} className={tab === 0 ? 'h-7 w-16' : 'h-7 w-20'} />
          ))}
        </div>

        {[0, 1].map((card) => (
          <div key={card} className='flex flex-col gap-4 rounded-xl border border-border p-6'>
            <div className='flex flex-col gap-2'>
              <Skeleton className='h-5 w-36' />
              <Skeleton className='h-4 w-72 max-w-full' />
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              {[0, 1].map((field) => (
                <div key={field} className='flex flex-col gap-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-9 w-full' />
                </div>
              ))}
            </div>
            <div className='flex flex-col gap-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-20 w-full' />
            </div>
            {card === 0 && <Skeleton className='h-9 w-24' />}
          </div>
        ))}
      </div>
    </div>
  );
}

// Inbox page (quotes): title + counters, then the 3-pane split — folders, thread list, reader.
// Mirrors QuoteInboxView so the panes don't jump when the real inbox streams in.
export function InboxPageSkeleton() {
  return (
    <div
      className='flex h-[calc(100svh-6.5rem)] w-full flex-col gap-3.5 md:h-[calc(100svh-7.5rem)]'
      aria-busy='true'
      aria-label='Loading'
    >
      <div className='flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Skeleton className='size-9 rounded-lg' />
          <div className='flex flex-col gap-1.5'>
            <Skeleton className='h-5 w-44' />
            <Skeleton className='h-3 w-72 max-w-full' />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-6 w-16 rounded-full' />
          <Skeleton className='h-6 w-24 rounded-full' />
        </div>
      </div>

      {/* Mobile filter chips */}
      <div className='flex gap-1.5 md:hidden'>
        {[0, 1, 2, 3].map((chip) => (
          <Skeleton key={chip} className='h-7 w-20 shrink-0 rounded-full' />
        ))}
      </div>

      <div className='flex min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-border/80'>
        {/* Folders */}
        <div className='hidden w-44 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border/70 p-2.5 md:flex lg:w-48 xl:w-52'>
          <Skeleton className='mx-2.5 mt-1 mb-1.5 h-3 w-14' />
          {[0, 1, 2, 3, 4, 5, 6].map((folder) => (
            <Skeleton key={folder} className='h-8 w-full rounded-lg' />
          ))}
        </div>

        {/* Thread list */}
        <div className='flex w-full shrink-0 flex-col overflow-hidden md:w-[310px] md:border-r md:border-border/70 lg:w-[350px] xl:w-[390px]'>
          <div className='border-b border-border/70 p-2.5'>
            <Skeleton className='h-8 w-full' />
          </div>
          {[0, 1, 2, 3, 4, 5].map((thread) => (
            <div key={thread} className='flex items-start gap-3 border-b border-border/60 p-3.5'>
              <Skeleton className='size-9 shrink-0 rounded-full' />
              <div className='flex min-w-0 flex-1 flex-col gap-2'>
                <div className='flex items-center justify-between gap-2'>
                  <Skeleton className='h-3.5 w-28' />
                  <Skeleton className='h-3 w-10' />
                </div>
                <Skeleton className='h-3 w-40' />
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-4 w-16 rounded' />
              </div>
            </div>
          ))}
        </div>

        {/* Reader */}
        <div className='hidden min-w-0 flex-1 flex-col gap-5 p-6 md:flex'>
          <div className='flex items-center gap-3'>
            <Skeleton className='size-11 rounded-full' />
            <div className='flex flex-col gap-2'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-3 w-56' />
            </div>
          </div>
          <div className='grid gap-3 sm:grid-cols-3'>
            {[0, 1, 2].map((stat) => (
              <Skeleton key={stat} className='h-16 w-full rounded-lg' />
            ))}
          </div>
          <Skeleton className='h-24 w-full rounded-lg' />
          <div className='grid grid-cols-3 gap-3'>
            {[0, 1, 2].map((photo) => (
              <Skeleton key={photo} className='aspect-video w-full rounded-lg' />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pipeline page (quotes, kanban view): title + counters, then the 8-column board.
// Mirrors QuoteKanbanView so the board doesn't jump when the real pipeline streams in.
export function KanbanPageSkeleton() {
  return (
    <div
      className='flex h-[calc(100svh-6.5rem)] w-full flex-col gap-3.5 md:h-[calc(100svh-7.5rem)]'
      aria-busy='true'
      aria-label='Loading'
    >
      <div className='flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Skeleton className='size-9 rounded-lg' />
          <div className='flex flex-col gap-1.5'>
            <Skeleton className='h-5 w-44' />
            <Skeleton className='h-3 w-72 max-w-full' />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-24 rounded-md' />
          <Skeleton className='h-8 w-8 rounded-md' />
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-hidden'>
        <div className='flex h-full w-full gap-3.5 overflow-x-auto pt-1 pb-4'>
          {Array.from({ length: 8 }, (_, col) => (
            <div
              key={col}
              className='flex h-full max-w-[320px] min-w-[290px] flex-1 flex-col rounded-xl border border-border bg-muted/25'
            >
              <div className='flex flex-col gap-1.5 rounded-t-xl border-b border-border/80 bg-background/50 p-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='size-2 rounded-full' />
                    <Skeleton className='h-3 w-16' />
                    <Skeleton className='size-5 rounded-full' />
                  </div>
                  <Skeleton className='size-6 rounded-md' />
                </div>
              </div>
              <div className='flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5'>
                {Array.from({ length: 3 }, (_, card) => (
                  <div key={card} className='flex flex-col gap-2.5 rounded-lg border border-border/80 bg-card p-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <Skeleton className='h-4 w-16 rounded' />
                      <Skeleton className='h-2.5 w-10' />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Skeleton className='h-3.5 w-3/4' />
                      <Skeleton className='h-3 w-1/2' />
                    </div>
                    <Skeleton className='h-5 w-full rounded-md' />
                    <div className='flex items-center justify-between border-t border-border/50 pt-1'>
                      <Skeleton className='h-3 w-12' />
                      <Skeleton className='h-5 w-5 rounded' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
