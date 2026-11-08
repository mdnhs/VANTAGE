// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as z from 'zod';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SchemaForm } from './schema-form';

afterEach(cleanup);

const Schema = z.object({
  first: z.string().min(1, 'First is required'),
  second: z.string().min(1, 'Second is required'),
  third: z.string().default(''),
});
const overrides = {
  first: { label: 'First field', section: 'One', sectionDescription: 'About one' },
  second: { label: 'Second field', section: 'Two' },
  third: { label: 'Third field', section: 'Two' },
};

const setup = (onSubmit = vi.fn()) => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SchemaForm
        schema={Schema}
        defaultValues={{ first: 'filled', second: '', third: '' }}
        onSubmit={onSubmit}
        submitLabel='Save'
        overrides={overrides}
        sectionTabs
      />
    </QueryClientProvider>,
  );
  return onSubmit;
};

const tab = (name: string) => screen.getByRole('tab', { name: new RegExp(`^${name}`) });

describe('SchemaForm sections as tabs', () => {
  it('shows one tab per section, the first open, with every field kept mounted', () => {
    setup();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['One', 'Two']);
    expect(tab('One').getAttribute('aria-selected')).toBe('true');
    expect(tab('Two').getAttribute('aria-selected')).toBe('false');
    // The hidden tab's inputs are still in the form, so they validate and submit.
    expect(document.querySelector('input[name="second"]')).not.toBeNull();
    expect(document.querySelector('input[name="third"]')).not.toBeNull();
  });

  it('switches tabs on click', async () => {
    setup();
    fireEvent.click(tab('Two'));
    await waitFor(() => expect(tab('Two').getAttribute('aria-selected')).toBe('true'));
    expect(screen.getByLabelText('Second field')).toBeTruthy();
  });

  it('opens the tab of the first error when a save fails, and marks it', async () => {
    const onSubmit = setup();
    expect(tab('One').getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(tab('Two').getAttribute('aria-selected')).toBe('true'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Second is required')).toBeTruthy();
    expect(screen.getAllByRole('img', { name: 'has errors' })).toHaveLength(1);
    expect(tab('Two').querySelector('[role="img"]')).not.toBeNull();
    expect(tab('One').querySelector('[role="img"]')).toBeNull();
  });

  it('saves values from every tab once they are valid', async () => {
    const onSubmit = setup();
    fireEvent.click(tab('Two'));
    fireEvent.change(document.querySelector('input[name="second"]')!, { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ first: 'filled', second: 'ok' });
  });
});
