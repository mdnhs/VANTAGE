// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatBytes, readJsonText } from '../helpers';
import type { FormField } from '../to-fields';
import { JsonFileWidget } from './json-file-widget';

afterEach(cleanup);

const field = {
  name: 'lottieLogo.json',
  label: 'Lottie animation',
  widget: 'json-file',
  required: false,
  node: {},
} as FormField;

describe('readJsonText', () => {
  it('accepts objects and arrays, refuses invalid or scalar JSON', () => {
    expect(readJsonText('{"v":"5.7"}')).toEqual({ ok: true, text: '{"v":"5.7"}' });
    expect(readJsonText('[1]').ok).toBe(true);
    expect(readJsonText('nope')).toEqual({ ok: false, error: 'This file is not valid JSON.' });
    expect(readJsonText('42')).toEqual({ ok: false, error: 'This file is not a JSON document.' });
    expect(readJsonText('null').ok).toBe(false);
  });
  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

function Harness({ spy }: { spy: (v: string | null) => void }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <JsonFileWidget
      field={field}
      value={value}
      onChange={(next) => {
        setValue(next ?? null);
        spy(next ?? null);
      }}
    />
  );
}

describe('JsonFileWidget', () => {
  it('loads a valid file, shows name and size, and removes it', async () => {
    let latest: string | null = null;
    render(<Harness spy={(v) => (latest = v)} />);
    const file = new File(['{"v":"5.7"}'], 'logo.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText('Choose Lottie animation file'), { target: { files: [file] } });
    await waitFor(() => expect(latest).toBe('{"v":"5.7"}'));
    expect((await screen.findByText(/logo\.json · 11 B/)).textContent).toContain('logo.json');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Lottie animation' }));
    expect(latest).toBeNull();
    expect(screen.getByText('No file chosen')).toBeTruthy();
  });

  it('rejects a file that is not JSON and keeps the old value', async () => {
    let latest: string | null = 'unchanged';
    render(<Harness spy={(v) => (latest = v)} />);
    const file = new File(['not json'], 'bad.json');
    fireEvent.change(screen.getByLabelText('Choose Lottie animation file'), { target: { files: [file] } });
    expect(await screen.findByText('This file is not valid JSON.')).toBeTruthy();
    expect(latest).toBe('unchanged');
  });

  it('rejects a file over 2 MB on selection with an error and does not call onChange', async () => {
    let called = false;
    render(<Harness spy={() => (called = true)} />);
    const bigFile = new File(['x'], 'big.json', { type: 'application/json' });
    Object.defineProperty(bigFile, 'size', { value: 2_000_001 });
    fireEvent.change(screen.getByLabelText('Choose Lottie animation file'), { target: { files: [bigFile] } });
    expect(await screen.findByText('Animations can be up to 2 MB')).toBeTruthy();
    expect(called).toBe(false);
  });
});
