// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StitchSocialProof } from '@/components/marketing/stitch-social-proof';
import { StitchServices } from '@/components/marketing/stitch-services';
import { InsuranceProvider } from '@/contexts/insurance-context';

afterEach(cleanup);

describe('StitchSocialProof default reviews', () => {
  it('drops the insurance review unless insurance is switched on', () => {
    const { unmount } = render(<StitchSocialProof testimonials={[]} partnerLogos={[]} />);
    expect(screen.queryByText('Verified Claim')).toBeNull();
    expect(screen.queryByText(/AXA/)).toBeNull();
    expect(screen.getByText('Siobhan Kelly')).toBeTruthy();
    unmount();
    render(<StitchSocialProof testimonials={[]} partnerLogos={[]} insurance />);
    expect(screen.getByText('Verified Claim')).toBeTruthy();
  });
});

describe('StitchServices catalogue', () => {
  const item = (id: string, title: string, description: string) =>
    ({
      id,
      title,
      description,
      badge: null,
      footnote: null,
      icon: 'wrench',
      iconMediaId: null,
      iconImage: null,
      displayOrder: 0,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as never;
  const items = [
    item('a', 'Dent repair', 'Paintless removal'),
    item('b', 'Insurance claim repairs', 'We handle the claim'),
  ];

  it('hides catalogue cards about insurance unless switched on', () => {
    const { unmount } = render(<StitchServices catalogItems={items} services={[]} />);
    expect(screen.getByText('Dent repair')).toBeTruthy();
    expect(screen.queryByText('Insurance claim repairs')).toBeNull();
    unmount();
    render(
      <InsuranceProvider enabled>
        <StitchServices catalogItems={items} services={[]} />
      </InsuranceProvider>,
    );
    expect(screen.getByText('Insurance claim repairs')).toBeTruthy();
  });
});
