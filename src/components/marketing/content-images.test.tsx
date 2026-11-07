import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PartnerLogoPublic } from '@/features/partner-logos/types';
import type { ProjectPublic } from '@/features/projects/types';
import type { PublicImage } from '@/lib/media/public-image';

import { PartnerLogosStrip } from './partner-logos-strip';
import { AboutHero } from './about-hero';
import { InsuranceHero } from './insurance-hero';
import { PortfolioHero } from './portfolio-hero';
import { StitchHero } from './stitch-hero';
import { ProjectGrid } from './project-grid';
import { ServicesHero } from './services-hero';

const image = (src: string): PublicImage => ({
  id: 'x',
  src,
  mimeType: 'image/png',
  width: 10,
  height: 10,
  alt: '',
  blurDataUrl: null,
  focal: { x: 0.2, y: 0.8 },
});

const logo = (over: Partial<PartnerLogoPublic>): PartnerLogoPublic =>
  ({
    id: 'l1',
    companyName: 'Aviva',
    logoMediaId: null,
    websiteUrl: null,
    displayOrder: 0,
    isEnabled: true,
    logo: null,
    ...over,
  }) as PartnerLogoPublic;

describe('PartnerLogosStrip', () => {
  it('renders a logo that only has a media id, from its PublicImage', () => {
    const html = renderToStaticMarkup(
      <PartnerLogosStrip logos={[logo({ logoMediaId: 'm1', logo: image('/uploads/aviva.png') })]} />,
    );
    expect(html).toContain(encodeURIComponent('/uploads/aviva.png'));
  });

  it('renders no image for a logo with neither id, never a blank Cloudinary URL', () => {
    const html = renderToStaticMarkup(<PartnerLogosStrip logos={[logo({})]} />);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('cloudinary');
  });
});

describe('ProjectGrid', () => {
  const project = (over: Partial<ProjectPublic>): ProjectPublic =>
    ({
      id: 'p1',
      title: 'Civic',
      slug: 'civic',
      vehicleModel: 'Civic',
      serviceCategory: 'Paint',
      description: 'd',
      completedAt: null,
      isFeatured: false,
      status: 'published',
      displayOrder: 0,
      beforeImageMediaId: null,
      afterImageMediaId: null,
      galleryImages: [],
      beforeImage: null,
      afterImage: null,
      gallery: [],
      ...over,
    }) as ProjectPublic;

  it('shows the media-backed after image and no photo when there is none', () => {
    const withImage = renderToStaticMarkup(
      <ProjectGrid projects={[project({ afterImage: image('/uploads/after.png') })]} />,
    );
    expect(withImage).toContain(encodeURIComponent('/uploads/after.png'));
    expect(withImage).toContain('object-position:20% 80%');
    const without = renderToStaticMarkup(<ProjectGrid projects={[project({})]} />);
    expect(without).not.toContain('<img');
    expect(without).not.toContain('cloudinary');
  });
});

describe('ServicesHero background', () => {
  const props = { eyebrow: 'e', headlineLine1: 'a', headlineAccent: 'b', subtext: 's' };
  const clip = { ...image('/uploads/shop.mp4'), mimeType: 'video/mp4' };

  it('keeps the built-in photo and no video by default', () => {
    const html = renderToStaticMarkup(<ServicesHero {...props} />);
    expect(html).toContain(encodeURIComponent('/assets/marketing/services-hero.jpg'));
    expect(html).not.toContain('<video');
  });

  it('plays the video over the chosen photo when switched on', () => {
    const html = renderToStaticMarkup(
      <ServicesHero {...props} video={clip} fallbackImage={image('/uploads/shop.jpg')} videoEnabled />,
    );
    expect(html).toContain('<video');
    expect(html).toContain('src="/uploads/shop.mp4"');
    expect(html).toContain('type="video/mp4"');
    expect(html).toContain('poster=');
  });

  it('shows the photo, not the video, while the switch is off', () => {
    const html = renderToStaticMarkup(
      <ServicesHero {...props} video={clip} fallbackImage={image('/uploads/shop.jpg')} />,
    );
    expect(html).not.toContain('<video');
    expect(html).toContain(encodeURIComponent('/uploads/shop.jpg'));
  });

  it('shows the photo when the switch is on but no video is chosen', () => {
    const html = renderToStaticMarkup(<ServicesHero {...props} videoEnabled />);
    expect(html).not.toContain('<video');
  });
});

describe('PortfolioHero background', () => {
  const props = { eyebrow: 'e', headlineLine1: 'a', headlineAccent: 'b', subtext: 's' };
  const clip = { ...image('/uploads/work.mp4'), mimeType: 'video/mp4' };

  it('has no background media by default', () => {
    const html = renderToStaticMarkup(<PortfolioHero {...props} />);
    expect(html).not.toContain('<video');
    expect(html).not.toContain('absolute inset-0');
  });

  it('shows the chosen photo while the video is off', () => {
    const html = renderToStaticMarkup(
      <PortfolioHero {...props} video={clip} fallbackImage={image('/uploads/work.jpg')} />,
    );
    expect(html).not.toContain('<video');
    expect(html).toContain(encodeURIComponent('/uploads/work.jpg'));
  });

  it('plays the video when switched on', () => {
    const html = renderToStaticMarkup(
      <PortfolioHero {...props} video={clip} fallbackImage={image('/uploads/work.jpg')} videoEnabled />,
    );
    expect(html).toContain('<video');
    expect(html).toContain('src="/uploads/work.mp4"');
  });

  it('plays the video even with no photo chosen', () => {
    const html = renderToStaticMarkup(<PortfolioHero {...props} video={clip} videoEnabled />);
    expect(html).toContain('<video');
  });
});

describe('InsuranceHero background', () => {
  const props = { eyebrow: 'e', line1: 'a', line2: 'b', line3: 'c', subtext: 's' };
  const clip = { ...image('/uploads/claims.mp4'), mimeType: 'video/mp4' };

  it('keeps the bundled photo and no video by default', () => {
    const html = renderToStaticMarkup(<InsuranceHero {...props} />);
    expect(html).toContain(encodeURIComponent('/assets/marketing/insurance-hero.jpg'));
    expect(html).not.toContain('<video');
  });

  it('shows the chosen photo while the video is off', () => {
    const html = renderToStaticMarkup(
      <InsuranceHero {...props} video={clip} fallbackImage={image('/uploads/claims.jpg')} />,
    );
    expect(html).not.toContain('<video');
    expect(html).toContain(encodeURIComponent('/uploads/claims.jpg'));
  });

  it('plays the video over the photo when switched on', () => {
    const html = renderToStaticMarkup(
      <InsuranceHero {...props} video={clip} fallbackImage={image('/uploads/claims.jpg')} videoEnabled />,
    );
    expect(html).toContain('<video');
    expect(html).toContain('src="/uploads/claims.mp4"');
    expect(html).toContain('poster=');
  });

  it('shows the photo when the switch is on but no video is chosen', () => {
    const html = renderToStaticMarkup(<InsuranceHero {...props} videoEnabled />);
    expect(html).not.toContain('<video');
  });
});

describe('AboutHero background', () => {
  const props = { eyebrow: 'e', line1: 'a', accent1: 'b', line2: 'c', accent2: 'd' };
  const clip = { ...image('/uploads/about.mp4'), mimeType: 'video/mp4' };

  it('keeps the built-in photo and no video by default', () => {
    const html = renderToStaticMarkup(<AboutHero {...props} image={null} />);
    expect(html).toContain(encodeURIComponent('/assets/marketing/about-hero.jpg'));
    expect(html).not.toContain('<video');
  });

  it('shows the chosen photo while the video is off', () => {
    const html = renderToStaticMarkup(<AboutHero {...props} image={image('/uploads/about.jpg')} video={clip} />);
    expect(html).not.toContain('<video');
    expect(html).toContain(encodeURIComponent('/uploads/about.jpg'));
  });

  it('plays the video over the photo when switched on', () => {
    const html = renderToStaticMarkup(
      <AboutHero {...props} image={image('/uploads/about.jpg')} video={clip} videoEnabled />,
    );
    expect(html).toContain('<video');
    expect(html).toContain('src="/uploads/about.mp4"');
    expect(html).toContain('poster=');
  });

  it('shows the photo when the switch is on but no video is chosen', () => {
    const html = renderToStaticMarkup(<AboutHero {...props} image={null} videoEnabled />);
    expect(html).not.toContain('<video');
  });
});

describe('hero heading text', () => {
  const text = (html: string) =>
    (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

  it('keeps a space between the lines of a page hero title', () => {
    const html = renderToStaticMarkup(
      <ServicesHero eyebrow='e' headlineLine1='Car Body Repair' headlineAccent='& Respray in Dublin' subtext='s' />,
    );
    expect(text(html)).toBe('Car Body Repair & Respray in Dublin');
  });

  it('keeps a space between the lines of the homepage title', () => {
    const html = renderToStaticMarkup(
      <StitchHero headlineLine1='Car Body Repair' headlineLine2='& Respray' headlineAccent='In Dublin' />,
    );
    expect(text(html)).toBe('Car Body Repair & Respray In Dublin');
  });
});
