// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SerpPreview, serpUrl } from './serp-preview';

afterEach(cleanup);

describe('SerpPreview', () => {
  it('prints the address the way a search result does', () => {
    expect(serpUrl('vantage.ie', '/our-work')).toBe('vantage.ie › our-work');
    expect(serpUrl('vantage.ie', '/')).toBe('vantage.ie');
  });

  it('says so when there is no description', () => {
    render(<SerpPreview url='vantage.ie' title='Home' description='' />);
    expect(screen.getByText('No description yet.')).toBeTruthy();
  });
});
