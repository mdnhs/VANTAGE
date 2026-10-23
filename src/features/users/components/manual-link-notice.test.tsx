import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ManualLinkNotice } from './manual-link-notice';

describe('ManualLinkNotice', () => {
  it('shows the link to copy when email was not sent', () => {
    const html = renderToStaticMarkup(
      <ManualLinkNotice email='new@example.com' link='https://vantage.test/reset-password?token=abc' />,
    );
    expect(html).toContain('new@example.com');
    expect(html).toContain('value="https://vantage.test/reset-password?token=abc"');
    expect(html).toContain('Copy link');
  });
});
