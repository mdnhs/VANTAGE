// @vitest-environment happy-dom
import { cleanup, fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProjectWithGallery } from '../types';
import { ProjectForm } from './project-form';

// The form's Details / SEO tabs keep the open tab in the URL (nuqs).
const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: NuqsTestingAdapter });

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/contexts/actor-provider', () => ({ useActor: () => ({ roles: ['editor'] }) }));
vi.mock('@/features/media/components/media-field', () => ({
  MediaField: ({ label, value, onChange }: { label: string; value: unknown; onChange(v: unknown): void }) => (
    <div>
      <span>{`${label} shows ${JSON.stringify(value)}`}</span>
      <button type='button' onClick={() => onChange({ kind: 'media', id: `${label.toLowerCase()}-id` })}>
        {`pick ${label}`}
      </button>
    </div>
  ),
}));
vi.mock('@/features/media/components/media-gallery-field', () => ({
  MediaGalleryField: ({ value, onChange }: { value: string[]; onChange(ids: string[]): void }) => (
    <div>
      <button type='button' onClick={() => onChange([...value, `g${value.length + 1}`])}>
        add gallery image
      </button>
    </div>
  ),
}));

afterEach(cleanup);

const fill = () => {
  for (const [label, value] of [
    ['Title', 'Civic'],
    ['Slug', 'civic'],
    ['Vehicle model', 'Civic'],
    ['Category', 'Paint'],
    ['Description', 'd'],
  ] as const) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
};

describe('ProjectForm', () => {
  it('submits before, after and gallery media ids in pick order', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProjectForm submitLabel='Create' isSubmitting={false} onSubmit={onSubmit} />);
    fill();
    fireEvent.click(screen.getByText('pick After'));
    fireEvent.click(screen.getByText('pick Before'));
    fireEvent.click(screen.getByText('add gallery image'));
    fireEvent.click(screen.getByText('add gallery image'));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      beforeImageMediaId: 'before-id',
      afterImageMediaId: 'after-id',
      galleryMediaIds: ['g1', 'g2'],
    });
  });

  it('keeps the SEO tab in the same form: its fields are saved with the details', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProjectForm submitLabel='Create' isSubmitting={false} onSubmit={onSubmit} />);
    fill();
    fireEvent.click(screen.getByText('pick After'));
    fireEvent.click(screen.getByText('pick Before'));
    fireEvent.click(screen.getByRole('tab', { name: 'Search & sharing' }));
    fireEvent.change(await screen.findByLabelText('SEO title'), { target: { value: 'BMW respray Dublin' } });
    fireEvent.click(screen.getByRole('switch', { name: 'Hide from search engines' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      title: expect.any(String),
      beforeImageMediaId: 'before-id',
      seoTitle: 'BMW respray Dublin',
      seoDescription: null,
      noindex: true,
    });
  });

  it('shows the required errors and does not submit without before and after', async () => {
    const onSubmit = vi.fn();
    render(<ProjectForm submitLabel='Create' isSubmitting={false} onSubmit={onSubmit} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Choose a before image')).not.toBeNull();
    expect(screen.getByText('Choose an after image')).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  const sampleProject = (galleryImages: object[]) =>
    ({
      id: 'p1',
      title: 'Civic',
      slug: 'civic',
      vehicleModel: 'Civic',
      serviceCategory: 'Paint',
      description: 'd',
      completedAt: null,
      isFeatured: false,
      beforeImageMediaId: 'bm1',
      afterImageMediaId: 'am1',
      galleryImages,
      beforeImage: null,
      afterImage: null,
      gallery: galleryImages.map((_, i) => ({ id: `g-${i}`, src: `/uploads/img-${i}.jpg` })),
    }) as unknown as ProjectWithGallery;

  it('an all-media gallery stays editable and sends the new order', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const rows = [{ id: 'r1', mediaId: 'm1', displayOrder: 0 }];
    render(
      <ProjectForm initialData={sampleProject(rows)} submitLabel='Save' isSubmitting={false} onSubmit={onSubmit} />,
    );
    fireEvent.click(screen.getByText('add gallery image'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ galleryMediaIds: ['m1', 'g2'] });
  });

  it('shows server causes under the image fields', () => {
    render(
      <ProjectForm
        submitLabel='Create'
        isSubmitting={false}
        onSubmit={vi.fn()}
        submitCauses={{ beforeImageMediaId: ['Choose a before image'], _media: ['Image x no longer exists'] }}
      />,
    );
    expect(screen.getByText('Choose a before image')).not.toBeNull();
  });
});
