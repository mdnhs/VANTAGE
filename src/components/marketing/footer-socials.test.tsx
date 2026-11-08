import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PublicImage } from '@/lib/media/public-image';

import { FooterSocials } from './footer-socials';

const icon: PublicImage = {
  id: 'x',
  src: '/uploads/facebook.svg',
  mimeType: 'image/svg+xml',
  width: 24,
  height: 24,
  alt: '',
  blurDataUrl: null,
  focal: { x: 0.5, y: 0.5 },
};

describe('FooterSocials', () => {
  it('renders nothing when there are no profiles', () => {
    expect(renderToStaticMarkup(<FooterSocials socials={[]} />)).toBe('');
  });

  it('links each profile to its address, named for screen readers, with the uploaded icon', () => {
    const html = renderToStaticMarkup(
      <FooterSocials socials={[{ name: 'Facebook', url: 'https://facebook.com/shop', icon }]} />,
    );
    expect(html).toContain('href="https://facebook.com/shop"');
    expect(html).toContain('aria-label="Facebook"');
    expect(html).toContain('src="/uploads/facebook.svg"');
  });

  it('opens in a new tab without leaking the opener', () => {
    const html = renderToStaticMarkup(
      <FooterSocials socials={[{ name: 'X', url: 'https://x.com/shop', icon: null }]} />,
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('shows the first letter of the name when there is no icon', () => {
    const html = renderToStaticMarkup(
      <FooterSocials socials={[{ name: 'tiktok', url: 'https://tiktok.com/@shop', icon: null }]} />,
    );
    expect(html).not.toContain('<img');
    expect(html).toMatch(/>t<\/span>/);
  });

  it('falls back to the site name from the address when the name is blank', () => {
    const html = renderToStaticMarkup(
      <FooterSocials socials={[{ name: '  ', url: 'https://www.instagram.com/shop', icon: null }]} />,
    );
    expect(html).toContain('aria-label="instagram.com"');
  });
});
