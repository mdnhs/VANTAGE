'use client';

import { useId } from 'react';

import { cn } from '@/lib/utils';

import { gaugeSummary, type GaugePart } from './chart-math';
import { formatNumber, formatShare } from './format';

const SWATCH: Record<GaugePart['tone'], string> = {
  solid: 'bg-chart-2',
  dark: 'bg-chart-4',
  hatched: 'bg-hatch',
};

// Half-ring geometry in a 200 x 100 box, centre at the bottom middle.
const CX = 100;
const CY = 100;
const OUTER = 96;
const INNER = 62;
const point = (theta: number, radius: number) =>
  `${(CX + radius * Math.cos(theta)).toFixed(3)} ${(CY - radius * Math.sin(theta)).toFixed(3)}`;

// One annular sector from fraction `from` to `to` of the half circle (left to right).
function sector(from: number, to: number) {
  const a = Math.PI * (1 - from);
  const b = Math.PI * (1 - to);
  return [
    `M ${point(a, OUTER)}`,
    `A ${OUTER} ${OUTER} 0 0 1 ${point(b, OUTER)}`,
    `L ${point(b, INNER)}`,
    `A ${INNER} ${INNER} 0 0 0 ${point(a, INNER)}`,
    'Z',
  ].join(' ');
}

// Semicircle of stacked solid, dark and hatched arcs with a big centred
// percentage and a legend (MK signature component, drawn as plain SVG).
export function Gauge({
  title,
  parts,
  centerLabel,
  headlineKey,
}: {
  title: string;
  parts: readonly GaugePart[];
  // Says what the percentage is, e.g. "Complete".
  centerLabel: string;
  // Key of the part whose share is the centred percentage. Defaults to the first part.
  headlineKey?: string;
}) {
  const hatchId = `gauge-hatch-${useId().replace(/:/g, '')}`;
  const summary = gaugeSummary(parts, headlineKey);
  const fill: Record<GaugePart['tone'], string> = {
    solid: 'var(--chart-2)',
    dark: 'var(--chart-4)',
    hatched: `url(#${hatchId})`,
  };
  let offset = 0;
  const arcs = summary.parts.map((part) => {
    const from = summary.total ? offset / summary.total : 0;
    offset += part.value;
    const to = summary.total ? offset / summary.total : 0;
    return { part, from, to };
  });

  return (
    <figure className='flex flex-1 flex-col items-center justify-center gap-5'>
      <div className='relative w-full max-w-sm'>
        <svg viewBox='0 0 200 100' className='block aspect-[2/1] w-full' aria-hidden>
          <defs>
            <pattern id={hatchId} width='8' height='8' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
              <rect width='8' height='8' fill='var(--hatch)' fillOpacity={0.25} />
              <rect width='3.5' height='8' fill='var(--hatch)' />
            </pattern>
          </defs>
          {summary.total ? (
            arcs
              .filter(({ part }) => part.value > 0)
              .map(({ part, from, to }) => (
                // A card-coloured edge opens the small gap between arcs.
                <path
                  key={part.key}
                  d={sector(from, to)}
                  fill={fill[part.tone]}
                  stroke='var(--card)'
                  strokeWidth={2}
                  strokeLinejoin='round'
                />
              ))
          ) : (
            // A neutral track: nothing to measure yet.
            <path d={sector(0, 1)} fill='var(--skeleton)' />
          )}
        </svg>
        <div className='absolute inset-x-0 bottom-0 flex flex-col items-center'>
          <p className='text-kpi tabular-nums'>{formatShare(summary.headline, summary.total)}</p>
          <p className='text-sm text-muted-foreground'>{centerLabel}</p>
        </div>
      </div>
      <table className='sr-only'>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope='col'>Part</th>
            <th scope='col'>Count</th>
          </tr>
        </thead>
        <tbody>
          {summary.parts.map((part) => (
            <tr key={part.key}>
              <th scope='row'>{part.label}</th>
              <td>{part.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Last child of the figure: a figcaption must be first or last. */}
      <figcaption>
        <ul className='flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium'>
          {summary.parts.map((part) => (
            <li key={part.key} className='flex items-center gap-2'>
              <span aria-hidden className={cn('size-4 rounded-full', SWATCH[part.tone])} />
              {part.label}
              <span className='text-muted-foreground tabular-nums'>{formatNumber(part.value)}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
