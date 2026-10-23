import { formatNumber } from './format';

export type PillBarDatum = {
  key: string;
  label: string;
  current: number;
  previous: number;
};

const PLOT_HEIGHT = 256;

// Capsule bars, hatched for the comparison period, with a floating value tag
// on the busiest bar (MK signature component 3, drawn with plain elements). The
// bars are hidden from assistive tech; the table below carries the numbers.
export function PillBarChart({
  title,
  data,
  currentLabel,
  previousLabel,
}: {
  title: string;
  data: readonly PillBarDatum[];
  currentLabel: string;
  previousLabel: string;
}) {
  // At least 1, so an all-zero week keeps a real scale instead of [0, 0].
  const max = Math.max(1, ...data.map((d) => Math.max(d.current, d.previous)));
  const currents = data.map((d) => d.current);
  const top = Math.max(0, ...currents);
  // A quiet week (all zeros) has no busiest day, so no tag.
  const peak = top > 0 ? currents.indexOf(top) : -1;
  const pct = (value: number) => (value > 0 ? Math.max(3, (value / max) * 100) : 0);

  return (
    <figure className='flex flex-col gap-4'>
      <div
        aria-hidden
        className='grid gap-2'
        style={{ gridTemplateColumns: `repeat(${data.length || 1}, minmax(0, 1fr))` }}
      >
        {data.map((datum, index) => (
          <div key={datum.key} className='flex flex-col items-center gap-3'>
            <div className='relative flex w-full items-end justify-center gap-1 pt-11' style={{ height: PLOT_HEIGHT }}>
              <div className='w-1/3 max-w-5 rounded-full bg-hatch' style={{ height: `${pct(datum.previous)}%` }} />
              <div className='w-1/3 max-w-5 rounded-full bg-chart-2' style={{ height: `${pct(datum.current)}%` }} />
              {index === peak ? (
                <span
                  data-testid='peak-tag'
                  className='absolute left-1/2 -translate-x-1/2 rounded-lg border border-chart-3 bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground'
                  style={{ bottom: `calc(${pct(datum.current)}% * (${PLOT_HEIGHT - 44} / ${PLOT_HEIGHT}) + 6px)` }}
                >
                  {formatNumber(datum.current)}
                </span>
              ) : null}
            </div>
            <span className='text-xs text-muted-foreground'>{datum.label}</span>
          </div>
        ))}
      </div>
      <table className='sr-only'>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope='col'>Day</th>
            <th scope='col'>{currentLabel}</th>
            <th scope='col'>{previousLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.key}>
              <th scope='row'>{datum.label}</th>
              <td>{datum.current}</td>
              <td>{datum.previous}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Last child of the figure: a figcaption must be first or last. */}
      <figcaption className='flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground'>
        <span className='flex items-center gap-2'>
          <span aria-hidden className='size-3 rounded-full bg-chart-2' />
          {currentLabel}
        </span>
        <span className='flex items-center gap-2'>
          <span aria-hidden className='size-3 rounded-full bg-hatch' />
          {previousLabel}
        </span>
      </figcaption>
    </figure>
  );
}
