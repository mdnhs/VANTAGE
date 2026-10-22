import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { WebsiteCard } from './website-card';

describe('WebsiteCard', () => {
  it('shows the host of a valid URL', () => {
    expect(renderToStaticMarkup(<WebsiteCard siteUrl='https://example.com/x' />)).toContain('example.com');
  });

  it('shows the raw string instead of crashing on a malformed URL', () => {
    expect(renderToStaticMarkup(<WebsiteCard siteUrl='not a url' />)).toContain('not a url');
  });
});
