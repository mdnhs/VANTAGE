// JSON for an inline <script>: `<`, `>`, `&` and the two JS line separators are
// escaped so a value can never close the tag or break the literal.
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
  );
}
