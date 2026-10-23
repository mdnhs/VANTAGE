'use client';

import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { formatBytes, readJsonText } from '../helpers';
import { GroupShell, type WidgetProps } from './shell';

// A JSON document chosen from a file (e.g. a Lottie animation). The value is
// the JSON text, or null. The file is parsed before it is accepted, so a bad
// file shows a message here instead of failing on save.
export function JsonFileWidget({ field, value, onChange, error }: WidgetProps<string | null | undefined>) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const text = typeof value === 'string' && value ? value : null;
  const bytes = text ? new Blob([text]).size : 0;

  async function pick(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) {
      setProblem('Animations can be up to 2 MB');
      return;
    }
    const result = readJsonText(await file.text());
    if (!result.ok) {
      setProblem(result.error);
      return;
    }
    setProblem(null);
    setFileName(file.name);
    onChange(result.text);
  }

  return (
    <GroupShell id={id} field={field} error={problem ?? error}>
      <div className='flex flex-wrap items-center gap-3'>
        <input
          ref={input}
          type='file'
          accept='application/json,.json'
          className='sr-only'
          aria-label={`Choose ${field.label} file`}
          tabIndex={-1}
          onChange={(event) => {
            void pick(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <Button type='button' variant='outline' onClick={() => input.current?.click()}>
          {text ? `Replace ${field.label}` : `Choose ${field.label} file`}
        </Button>
        {text ? (
          <>
            <span className='text-sm text-muted-foreground'>
              {fileName ?? 'Current file'} · {formatBytes(bytes)}
            </span>
            <Button
              type='button'
              variant='ghost'
              aria-label={`Remove ${field.label}`}
              onClick={() => {
                setFileName(null);
                setProblem(null);
                onChange(null);
              }}
            >
              Remove
            </Button>
          </>
        ) : (
          <span className='text-sm text-muted-foreground'>No file chosen</span>
        )}
      </div>
    </GroupShell>
  );
}
