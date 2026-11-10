type Address = { lines: readonly string[]; city: string; eircode: string; country: string };

// One line for display: lines, city, Eircode, country. A part that is already written in the text
// before it (for example "Ireland" at the end of the last line) is not repeated.
export function formatAddress(address: Address): string {
  const parts = [...address.lines, address.city, address.eircode, address.country]
    .map((part) => part.trim())
    .filter(Boolean);
  const kept: string[] = [];
  for (const part of parts) {
    const text = kept.join(', ').toLowerCase();
    if (!text.split(/,\s*/).includes(part.toLowerCase())) kept.push(part);
  }
  return kept.join(', ');
}
