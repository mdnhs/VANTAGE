import type { ReactNode } from 'react';

// https links, and the site's own pages written as a path (/get-a-quote): the bot is told to write
// paths, so the link always points at the site the visitor is on (localhost, staging or live).
const LINK_RE =
  /(https?:\/\/[^\s<>"']+|(?<![\w/.:-])\/(?:get-a-quote|contact|services|our-work|about|process)(?:\/[\w-]+)?)/g;
const TRAILING = /[.,;:!?)\]]+$/;

// Chat text with its links made tappable. Plain strings otherwise; only http(s) links and the
// site's own paths become anchors.
export function LinkifiedText({ text }: { text: string }): ReactNode {
  return text.split(LINK_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    const trail = TRAILING.exec(part)?.[0] ?? '';
    const target = trail ? part.slice(0, -trail.length) : part;
    const internal = target.startsWith('/');
    const label = internal && typeof window !== 'undefined' ? `${window.location.origin}${target}` : target;
    return (
      <span key={i}>
        <a
          href={target}
          {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          className='break-all underline underline-offset-2'
        >
          {label}
        </a>
        {trail}
      </span>
    );
  });
}
