// Pure helpers behind the widgets and SchemaForm, split out so they can be
// unit-tested without rendering.

export type SubmitResult = void | {
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};

// A new array with the item at `from` moved to `to`. Out-of-range moves return
// a copy unchanged.
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

// Partial input ("-", "1e") reads as NaN: treat it as empty so Zod reports
// "required", not a confusing type error.
export function parseNumberInput(valueAsNumber: number, nullable: boolean | undefined): number | null | undefined {
  if (!Number.isNaN(valueAsNumber)) return valueAsNumber;
  return nullable ? null : undefined;
}

// Turns an onSubmit result into the errors to set on the form: the first
// message per field, plus an optional root message.
export function submitResultErrors(result: SubmitResult): {
  fields: { name: string; message: string }[];
  root?: string;
} {
  const fields = Object.entries(result?.fieldErrors ?? {}).flatMap(([name, messages]) =>
    messages[0] ? [{ name, message: messages[0] }] : [],
  );
  return { fields, root: result?.formError || undefined };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// The text of a JSON file, accepted only when it parses to an object or array.
export function readJsonText(text: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed === null || typeof parsed !== 'object') return { ok: false, error: 'This file is not a JSON document.' };
    return { ok: true, text };
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
}
