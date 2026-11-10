import { describe, expect, it } from 'vitest';

import { pageText } from './knowledge-text';

describe('pageText', () => {
  it('keeps visible copy and drops links, ids, media and short labels', () => {
    const text = pageText({
      hero: {
        title: 'Accident repair done properly',
        image: { src: '/a.jpg', alt: 'A car in the booth' },
        ctaHref: '/quote',
      },
      id: 'abcdef123456789',
      label: 'Go',
      url: 'https://example.com/a-long-link-here',
    });
    expect(text).toBe('Accident repair done properly');
  });

  it('keeps a question with its answer and removes repeats', () => {
    const text = pageText({
      faq: { items: [{ question: 'Do you work with insurers?', answer: 'Yes, we handle the claim paperwork.' }] },
      again: 'Accident repair done properly',
      twice: 'Accident repair done properly',
    });
    expect(text).toBe(
      'Q: Do you work with insurers? A: Yes, we handle the claim paperwork.\nAccident repair done properly',
    );
  });

  it('stops at the size limit', () => {
    const big = { items: Array.from({ length: 100 }, (_, i) => `A sentence number ${i} that is long enough to keep`) };
    expect(pageText(big, 200).length).toBeLessThanOrEqual(200);
  });
});
