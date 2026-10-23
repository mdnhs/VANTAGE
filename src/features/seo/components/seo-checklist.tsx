import { CircleAlertIcon, CircleCheckIcon, CircleHelpIcon } from 'lucide-react';

import { LOCAL_CHECKS, runChecks, type CheckInput } from '@/lib/seo/checks';
import { cn } from '@/lib/utils';

// ok === null: not known yet (or not checkable); neither passed nor failed.
function Check({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  const Icon = ok === null ? CircleHelpIcon : ok ? CircleCheckIcon : CircleAlertIcon;
  return (
    <li className='flex items-start gap-2.5 text-sm'>
      <Icon
        aria-hidden
        className={cn(
          'mt-0.5 size-4 shrink-0',
          ok === null ? 'text-muted-foreground' : ok ? 'text-success' : 'text-warning',
        )}
      />
      <span>
        <span className='sr-only'>{ok === null ? 'Not checked: ' : ok ? 'Passed: ' : 'Needs work: '}</span>
        {children}
      </span>
    </li>
  );
}

// Only what an editor can judge from one page; the checks that need the whole
// site (unique titles, alt coverage, links) live in the SEO overview.
export function SeoChecklist({
  input,
  ogUnknown,
}: {
  input: CheckInput;
  // Why the share image's size cannot be judged: still loading, unreadable, or a legacy image.
  ogUnknown?: string;
}) {
  return (
    <ul className='flex flex-col gap-2.5' aria-label='Checks'>
      {runChecks(input)
        .filter((c) => LOCAL_CHECKS.includes(c.id))
        .map((c) => (
          <Check key={c.id} ok={c.id === 'og-image' && ogUnknown ? null : c.ok}>
            {c.id === 'og-image' && ogUnknown ? ogUnknown : c.message}
          </Check>
        ))}
    </ul>
  );
}
