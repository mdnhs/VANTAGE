type Address = { lines: readonly string[]; city: string; eircode: string; country: string };

// "IE" and "Ireland" name the same country.
const COUNTRY_ALIASES: Record<string, string> = { ie: 'ireland', irl: 'ireland', 'republic of ireland': 'ireland' };
const canonicalCountry = (country: string) => COUNTRY_ALIASES[country.toLowerCase()] ?? country.toLowerCase();

const escapeRe = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One line for display: lines, city, Eircode, country. A part that is already written in the text
// before it is not repeated: a city or Eircode that is a whole comma-separated part, and the
// country (as a whole word, "IE" counting as "Ireland") wherever it appears.
export function formatAddress(address: Address): string {
  const parts = [...address.lines, address.city, address.eircode].map((part) => part.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const part of parts) {
    const segments = kept.join(', ').toLowerCase().split(/,\s*/);
    if (!segments.includes(part.toLowerCase())) kept.push(part);
  }
  const country = address.country.trim();
  if (country) {
    const wanted = canonicalCountry(country);
    const text = kept.join(', ').toLowerCase();
    const named = new RegExp(
      `\\b(${[
        wanted,
        ...Object.entries(COUNTRY_ALIASES)
          .filter(([, v]) => v === wanted)
          .map(([k]) => k),
      ]
        .map(escapeRe)
        .join('|')})\\b`,
    ).test(text);
    if (!named) kept.push(wanted === 'ireland' ? 'Ireland' : country);
  }
  return kept.join(', ');
}
