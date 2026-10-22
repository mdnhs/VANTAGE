import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PartnerLogoPublic } from '@/features/partner-logos/types';
import type { ProjectPublic } from '@/features/projects/types';
import type { PublicImage } from '@/lib/media/public-image';

import { PartnerLogosStrip } from './partner-logos-strip';
import { ProjectGrid } from './project-grid';

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
    logoPublicId: null,
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
      beforeImagePublicId: null,
      afterImagePublicId: null,
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
