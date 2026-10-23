// @vitest-environment happy-dom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { PillBarChart, type PillBarDatum } from './pill-bar-chart';

afterEach(cleanup);

const WEEK: PillBarDatum[] = [
  { key: 'mon', label: 'Mon', current: 4, previous: 3 },
  { key: 'tue', label: 'Tue', current: 9, previous: 5 },
  { key: 'wed', label: 'Wed', current: 2, previous: 7 },
];

const chart = (data: PillBarDatum[]) =>
  render(<PillBarChart title='Enquiries this week' data={data} currentLabel='This week' previousLabel='Last week' />);

it('carries every day in its screen-reader table', () => {
  chart(WEEK);
  const table = screen.getByRole('table', { name: 'Enquiries this week' });
  const rows = within(table).getAllByRole('row').slice(1);
  expect(rows.map((row) => row.textContent)).toEqual(['Mon43', 'Tue95', 'Wed27']);
});

it('tags only the busiest day', () => {
  const { container } = chart(WEEK);
  const tags = container.querySelectorAll("[data-testid='peak-tag']");
  expect([...tags].map((tag) => tag.textContent)).toEqual(['9']);
});

it('has no tag in a week of zeros, and no NaN anywhere', () => {
  const { container } = chart(WEEK.map((day) => ({ ...day, current: 0, previous: 0 })));
  expect(container.textContent).toContain('Mon');
  expect(container.querySelectorAll("[data-testid='peak-tag']")).toHaveLength(0);
  expect(container.innerHTML).not.toContain('NaN');
});

it('ends the figure with its caption', () => {
  const { container } = chart(WEEK);
  expect(container.querySelector('figure')?.lastElementChild?.tagName).toBe('FIGCAPTION');
});
