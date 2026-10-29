import { describe, expect, it } from 'vitest';

import { llmsText } from './llms';

describe('llmsText', () => {
  it('writes the llmstxt.org layout and skips empty sections', () => {
    const out = llmsText({
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
});
