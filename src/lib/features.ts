// The Insurance page is switched off for now (nothing insurance-related is shown on the site or in
// the admin). Flip to true to bring the page, its links, the chat hint and the admin entry back.
export const INSURANCE_ENABLED = false;

// A navigation or footer link that points at the Insurance page, whatever its label or whether it
// came from the defaults or from saved Settings.
export const isInsuranceHref = (href: string): boolean => /^\/insurance(?:[/?#]|$)/i.test(href.trim());

export const visibleLink = <T extends { href: string }>(link: T): boolean =>
  INSURANCE_ENABLED || !isInsuranceHref(link.href);

// Copy (a benefit, a FAQ, a standard) that talks about insurance, hidden while it is switched off.
export const visibleCopy = (...texts: (string | null | undefined)[]): boolean =>
  INSURANCE_ENABLED || !texts.some((t) => t && /insur|\bclaims?\b|\bloss adjuster/i.test(t));
