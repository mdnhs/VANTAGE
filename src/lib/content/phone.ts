/**
 * Builds a tel: URI from a display number and optional E.164 string.
 * Uses the E.164 string when it is valid international format (+[1-9] followed by 6-14 digits).
 * Otherwise strips everything except plus and digits from the display representation.
 */
export function telHref(display: string, e164?: string | null): string {
  if (e164 && /^\+[1-9]\d{6,14}$/.test(e164)) {
    return `tel:${e164}`;
  }
  const stripped = display.replace(/[^\d+]/g, '');
  return `tel:${stripped}`;
}

/**
 * Builds a WhatsApp chat link (https://wa.me/<digits>) from a phone or WhatsApp number.
 */
export function whatsappHref(number: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}
