import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LegalPageView } from './legal-page-view';

describe('LegalPageView', () => {
  const html = renderToStaticMarkup(
    <LegalPageView
      title='Privacy Policy'
      updatedAt={new Date('2026-10-28T12:00:00Z')}
      html='<h2>Your data</h2><p>Kept safe.</p>'
    />,
  );

  it('renders the title as the page heading', () => {
    expect(html).toMatch(/<h1[^>]*>Privacy Policy<\/h1>/);
  });

  it('shows the Irish-formatted last-updated date', () => {
    expect(html).toContain('Last updated');
    expect(html).toContain('28 October 2026');
    expect(html).toContain('dateTime="2026-10-28T12:00:00.000Z"');
  });

  it('renders the body markup', () => {
    expect(html).toContain('<h2>Your data</h2><p>Kept safe.</p>');
  });

  it('omits the date when the page has none', () => {
    expect(renderToStaticMarkup(<LegalPageView title='Terms' updatedAt={null} html='' />)).not.toContain(
      'Last updated',
    );
  });
});
