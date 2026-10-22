import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react';

import { LOCAL_CHECKS, runChecks, type CheckInput } from '@/lib/seo/checks';
import { cn } from '@/lib/utils';

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CircleCheckIcon : CircleAlertIcon;
  return (
    <li className='flex items-start gap-2.5 text-sm'>
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', ok ? 'text-success' : 'text-warning')} />
      <span>
        <span className='sr-only'>{ok ? 'Passed: ' : 'Needs work: '}</span>
        {children}
      </span>
    </li>
  );
}

// Only what an editor can judge from one page; the checks that need the whole
// site (unique titles, alt coverage, links) live in the SEO overview.
export function SeoChecklist({ input }: { input: CheckInput }) {
  return (
    <ul className='flex flex-col gap-2.5' aria-label='Checks'>
      {runChecks(input)
        .filter((c) => LOCAL_CHECKS.includes(c.id))
        .map((c) => (
          <Check key={c.id} ok={c.ok}>
            {c.message}
          </Check>
        ))}
    </ul>
  );
}
