// Whether the Insurance page and insurance wording are shown is an admin setting
// (Settings → Business → "Show the Insurance page"). These helpers take that flag as an argument;
// server code reads it with getInsuranceEnabled(), client components with useInsuranceEnabled().

// A navigation or footer link that points at the Insurance page, whatever its label or whether it
// came from the defaults or from saved Settings.
export const isInsuranceHref = (href: string): boolean => /^\/insurance(?:[/?#]|$)/i.test(href.trim());

export const visibleLink = <T extends { href: string }>(link: T, insurance: boolean): boolean =>
  insurance || !isInsuranceHref(link.href);

// Copy (a benefit, a FAQ, a standard) that talks about insurance, hidden while it is switched off.
export const visibleCopy = (insurance: boolean, ...texts: (string | null | undefined)[]): boolean =>
  insurance || !texts.some((t) => t && /insur|\bclaims?\b|\bloss adjuster/i.test(t));
