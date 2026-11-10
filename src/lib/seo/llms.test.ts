import { describe, expect, it } from 'vitest';

import { llmsText } from './llms';

describe('llmsText', () => {
  it('writes the llmstxt.org layout and skips empty sections', () => {
    const out = llmsText({
      insurance: false,
      siteName: 'Vantage Autobody',
      summary: 'Crash repair\nin Dublin.',
      details: ['Phone: +353 1 234 5678', ''],
      pages: [{ title: 'Services', url: 'https://x.ie/services', description: 'What we repair' }],
      services: [{ title: 'Respray', url: 'https://x.ie/services/respray' }],
      projects: [],
      legal: [{ title: 'Privacy', url: 'https://x.ie/privacy' }],
    });
    expect(out).toBe(
      [
        '# Vantage Autobody',
        '',
        '> Crash repair in Dublin.',
        '',
        '- Phone: +353 1 234 5678',
        '',
        '## Pages',
        '',
        '- [Services](https://x.ie/services): What we repair',
        '',
        '## Services',
        '',
        '- [Respray](https://x.ie/services/respray)',
        '',
        '## Optional',
        '',
        '- [Privacy](https://x.ie/privacy)',
        '',
      ].join('\n'),
    );
  });

  it('leaves out insurance links and wording unless insurance is switched on', () => {
    const input = {
      siteName: 'Shop',
      summary: '',
      details: [],
      pages: [
        { title: 'Services', url: 'https://x.ie/services', description: 'What we repair' },
        { title: 'Insurance Claim Repairs', url: 'https://x.ie/insurance', description: 'We deal with your insurer' },
        { title: 'About', url: 'https://x.ie/about', description: 'Insurer-approved repairs since 1998' },
      ],
      services: [],
      projects: [],
      legal: [],
    };
    const off = llmsText({ ...input, insurance: false });
    expect(off).toContain('/services');
    expect(off).not.toMatch(/insur/i);
    expect(llmsText({ ...input, insurance: true })).toContain('/insurance');
  });

  it('keeps a page link but drops its insurance description, blanks an insurance summary, and lists rows as written', () => {
    const out = llmsText({
      insurance: false,
      siteName: 'Shop',
      summary: 'Insurer approved repairs',
      details: [],
      pages: [{ title: 'Home', url: 'https://x.ie/', description: 'Insurer approved, with free quotes' }],
      services: [{ title: 'Respray', url: 'https://x.ie/services/respray', description: 'Insurance claim repairs' }],
      projects: [],
      legal: [],
    });
    expect(out).toContain('[Home](https://x.ie/)');
    expect(out).toContain('[Respray](https://x.ie/services/respray): Insurance claim repairs');
    expect(out).not.toContain('Insurer approved');
  });
});
