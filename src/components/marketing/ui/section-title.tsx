'use client';

import { motion, type Variants } from 'motion/react';
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

// Section titles enter the way the hero title does: every word rises out of its own mask with a
// slight tilt, one after the other, once the title scrolls into view. Wrap an <h2>'s content in
// this instead of writing the tag by hand; the words stay real text with real spaces between
// them, so search engines and screen readers read the heading as before.

const EASE = [0.16, 1, 0.3, 1] as const;

const title: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const word: Variants = {
  hidden: { y: '112%', rotate: 3 },
  show: { y: '0%', rotate: 0, transition: { duration: 0.9, ease: EASE } },
};

function Word({ children }: { children: string }) {
  return (
    <span className='[margin-bottom:-0.08em] inline-block overflow-hidden pb-[0.08em] align-bottom'>
      <motion.span variants={word} className='inline-block origin-bottom-left'>
        {children}
      </motion.span>
    </span>
  );
}

// Words inside text, and inside any plain elements (an accent <span>); <br /> stays as it is.
function split(node: ReactNode): ReactNode {
  return Children.toArray(node).map((child, index) => {
    if (typeof child === 'string') {
      return child
        .split(/(\s+)/)
        .filter(Boolean)
        .map((part, i) => (/^\s+$/.test(part) ? part : <Word key={`${index}-${i}`}>{part}</Word>));
    }
    if (isValidElement(child) && child.type !== 'br') {
      const element = child as ReactElement<{ children?: ReactNode }>;
      return cloneElement(element, undefined, split(element.props.children));
    }
    return child;
  });
}

export function SectionTitle({
  children,
  className,
  as = 'h2',
}: {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2';
}) {
  const Tag = as === 'h1' ? motion.h1 : motion.h2;
  return (
    <Tag
      data-motion-title
      variants={title}
      initial='hidden'
      whileInView='show'
      viewport={{ once: true, amount: 0.6 }}
      className={className}
    >
      {split(children)}
    </Tag>
  );
}
