import { describe, expect, it } from 'vitest';

import { isInsuranceHref, visibleCopy, visibleLink } from './features';

describe('insurance visibility helpers', () => {
  it('hides links to the insurance page unless it is switched on', () => {
    expect(isInsuranceHref('/insurance')).toBe(true);
    expect(isInsuranceHref('/insurance/claims')).toBe(true);
    expect(isInsuranceHref('/insurance-x')).toBe(false);
    expect(visibleLink({ href: '/insurance' }, false)).toBe(false);
    expect(visibleLink({ href: '/insurance' }, true)).toBe(true);
    expect(visibleLink({ href: '/services' }, false)).toBe(true);
  });

  it('hides copy that talks about insurance unless it is switched on', () => {
    expect(visibleCopy(false, 'Direct insurance support')).toBe(false);
    expect(visibleCopy(false, 'Fast', 'We handle the claim paperwork')).toBe(false);
    expect(visibleCopy(true, 'Direct insurance support')).toBe(true);
    expect(visibleCopy(false, 'Free quotes', null, undefined)).toBe(true);
  });
});
