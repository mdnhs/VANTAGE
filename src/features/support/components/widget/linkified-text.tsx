import type { ReactNode } from 'react';

// One pass over the chat text, earliest match wins:
//  - https links, and the site's own pages written as a path (/get-a-quote): the bot is told to
//    write paths, so the link always points at the site the visitor is on (localhost, staging, live)
//  - email addresses -> mailto:
//  - phone numbers (9-14 digits, single spaces or hyphens between) -> tel:, or wa.me when the same
//    line names WhatsApp before the number
const TOKEN_RE = new RegExp(
  [
    /(https?:\/\/[^\s<>"']+|(?<![\w/.:-])\/(?:get-a-quote|contact|services|our-work|about|process)(?:\/[\w-]+)?)/
      .source,
    /((?<![\w.+-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/.source,
    /((?<![\w+])\+?\d(?:[ -]?\d){8,13}(?![\w]))/.source,
  ].join('|'),
  'g',
);
const TRAILING = /[.,;:!?)\]]+$/;
const WHATSAPP_RE = /whats\s?app/i;
const LINK_CLASS = 'break-all underline underline-offset-2';

// International digits for tel:/wa.me. Numbers written the Irish way (085 ..., 00353 ...) get 353.
function internationalDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `353${digits.slice(1)}`;
  return digits;
}

function anchor(key: number, href: string, label: string, external: boolean): ReactNode {
  return (
    <a
      key={key}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={LINK_CLASS}
    >
      {label}
    </a>
  );
}

// Chat text with its links, emails and phone numbers made tappable. Plain strings otherwise;
// only http(s) links, the site's own paths, mailto:, tel: and wa.me become anchors.
export function LinkifiedText({ text }: { text: string }): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const [, url, email, phone] = m;
    if (url) {
      const trail = TRAILING.exec(url)?.[0] ?? '';
      const target = trail ? url.slice(0, -trail.length) : url;
      const internal = target.startsWith('/');
      const label = internal && typeof window !== 'undefined' ? `${window.location.origin}${target}` : target;
      out.push(anchor(start, target, label, !internal));
      if (trail) out.push(trail);
    } else if (email) {
      out.push(anchor(start, `mailto:${email}`, email, false));
    } else if (phone) {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const isWhatsApp = WHATSAPP_RE.test(text.slice(lineStart, start));
      const digits = internationalDigits(phone);
      out.push(
        isWhatsApp
          ? anchor(start, `https://wa.me/${digits}`, phone, true)
          : anchor(start, `tel:+${digits}`, phone, false),
      );
    }
    last = start + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
