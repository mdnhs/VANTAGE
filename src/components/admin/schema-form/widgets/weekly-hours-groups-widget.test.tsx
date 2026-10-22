// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { GLOBALS, parseGlobal } from '@/lib/content/globals';
import { GLOBAL_FIELD_UI } from '@/features/globals/global-ui';

import { SchemaForm } from '../schema-form';
import { toFields, type FormField } from '../to-fields';
import { toggleDay, WeeklyHoursGroupsWidget, type HoursGroup } from './weekly-hours-groups-widget';

afterEach(cleanup);

const day = (row: number, name: string) =>
  within(screen.getByRole('group', { name: `Days for opening times ${row}` })).getByRole('checkbox', { name });
// Base UI toggles through its hidden native input; clicking that is what a label click does.
const toggle = (row: number, name: string) =>
  fireEvent.click(day(row, name).parentElement!.querySelector('input[type=checkbox]')!);

const field = (): FormField =>
  toFields(GLOBALS.contact, GLOBAL_FIELD_UI.contact)
    .find((f) => f.name === 'hours')!
    .fields!.find((f) => f.name === 'hours.weekly')!;

function Harness({ initial, spy }: { initial: HoursGroup[]; spy: (v: HoursGroup[]) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <WeeklyHoursGroupsWidget
      field={field()}
      value={value}
      onChange={(next) => {
        setValue(next ?? []);
        spy(next ?? []);
      }}
    />
  );
}

describe('weekly-hours-groups override', () => {
  it('is selected for contact hours.weekly and keeps the schema max of 7', () => {
    expect(field()).toMatchObject({ widget: 'weekly-hours-groups', label: 'Opening times' });
    expect(field().node.maxItems).toBe(7);
  });
});

describe('toggleDay', () => {
  it('keeps ISO days sorted and unique', () => {
    expect(toggleDay([1, 3], 2, true)).toEqual([1, 2, 3]);
    expect(toggleDay([1, 2], 2, true)).toEqual([1, 2]);
    expect(toggleDay([1, 2, 3], 2, false)).toEqual([1, 3]);
  });
});

describe('WeeklyHoursGroupsWidget', () => {
  const initial: HoursGroup[] = [{ days: [1, 2, 3, 4, 5], opens: '08:00', closes: '18:00' }];

  it('renders seven weekday checkboxes and two time inputs per row, in a named group', () => {
    render(<Harness initial={initial} spy={() => {}} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(7);
    expect(day(1, 'Monday').getAttribute('aria-checked')).toBe('true');
    expect(day(1, 'Saturday').getAttribute('aria-checked')).toBe('false');
    expect((screen.getByLabelText('Opens, opening times 1') as HTMLInputElement).type).toBe('time');
    expect((screen.getByLabelText('Closes, opening times 1') as HTMLInputElement).value).toBe('18:00');
    expect(screen.getByRole('group', { name: 'Opening times' })).toBeTruthy();
  });

  it('emits values the contact schema accepts after editing, adding and removing rows', () => {
    let latest: HoursGroup[] = initial;
    render(<Harness initial={initial} spy={(v) => (latest = v)} />);

    toggle(1, 'Saturday');
    expect(latest[0]!.days).toEqual([1, 2, 3, 4, 5, 6]);
    fireEvent.change(screen.getByLabelText('Closes, opening times 1'), { target: { value: '17:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add opening times' }));
    expect(latest).toHaveLength(2);
    toggle(2, 'Sunday');

    const parsed = GLOBALS.contact.shape.hours.parse({ weekly: latest });
    expect(parsed.weekly).toEqual([
      { days: [1, 2, 3, 4, 5, 6], opens: '08:00', closes: '17:30' },
      { days: [1, 2, 3, 4, 5, 7], opens: '08:00', closes: '18:00' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Remove opening times 1' }));
    expect(latest).toHaveLength(1);
    expect(GLOBALS.contact.safeParse({ hours: { weekly: latest } }).success).toBe(true);
  });

  it('stops adding at 7 rows', () => {
    const seven = Array.from({ length: 7 }, () => ({ days: [1], opens: '08:00', closes: '18:00' }));
    render(<Harness initial={seven} spy={() => {}} />);
    expect((screen.getByRole('button', { name: 'Add opening times' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('contact form with the widget', () => {
  it('renders the default hours through SchemaForm', () => {
    const html = renderToStaticMarkup(
      <SchemaForm
        schema={GLOBALS.contact}
        overrides={GLOBAL_FIELD_UI.contact}
        defaultValues={parseGlobal('contact', {})}
        submitLabel='Save contact'
        onSubmit={() => {}}
      />,
    );
    expect(html).toContain('Opening times');
    expect(html).toContain('Add opening times');
    expect(html).toContain('Leave blank to generate it from the opening times.');
  });
});
