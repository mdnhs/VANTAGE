import type { ReactNode } from 'react';

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;
const TRAILING = /[.,;:!?)\]]+$/;

// Chat text with its https links made tappable. Plain strings otherwise; only http(s) links are
// ever turned into anchors, and they open in a new tab.
export function LinkifiedText({ text }: { text: string }): ReactNode {
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    const trail = TRAILING.exec(part)?.[0] ?? '';
    const href = trail ? part.slice(0, -trail.length) : part;
    return (
      <span key={i}>
        <a href={href} target='_blank' rel='noopener noreferrer' className='break-all underline underline-offset-2'>
          {href}
        </a>
        {trail}
      </span>
    );
  });
}
