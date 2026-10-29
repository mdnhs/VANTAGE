import { cn } from '@/lib/utils';

// A live "n characters (aim for a–b)" hint under an SEO field; quiet while the field is blank.
export function CharCount({ value, range }: { value: string; range: readonly [number, number] }) {
  const n = value.trim().length;
  if (!n) return null;
  const ok = n >= range[0] && n <= range[1];
  return (
    <p className={cn('text-xs', ok ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400')}>
      {n} characters (aim for {range[0]}–{range[1]})
    </p>
  );
}
