// Formula injection (OWASP CSV injection): a leading = + - @ (after any whitespace), tab or CR
// would run as a formula in a spreadsheet, so the cell gets a leading apostrophe. Every cell is quoted.
const FORMULA = /^\s*[=+\-@]|^[\t\r]/;

function cell(value: unknown): string {
  const text = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
  const safe = FORMULA.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => cell(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => cell(row[c.key])).join(','));
  return [header, ...body].join('\r\n');
}
