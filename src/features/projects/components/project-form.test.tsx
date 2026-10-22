// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProjectWithGallery } from '../types';
import { ProjectForm } from './project-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
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

  it('shows the required errors and does not submit without before and after', async () => {
    const onSubmit = vi.fn();
    render(<ProjectForm submitLabel='Create' isSubmitting={false} onSubmit={onSubmit} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Choose a before image')).not.toBeNull();
    expect(screen.getByText('Choose an after image')).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('editing a legacy project leaves its images and gallery out of the payload until changed', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const project = {
      id: 'p1',
      title: 'Civic',
      slug: 'civic',
      vehicleModel: 'Civic',
      serviceCategory: 'Paint',
      description: 'd',
      completedAt: null,
      isFeatured: false,
      beforeImagePublicId: 'old-before',
      afterImagePublicId: 'old-after',
      beforeImageMediaId: null,
      afterImageMediaId: null,
      galleryImages: [{ id: 'r1', mediaId: null, imagePublicId: 'old-g', displayOrder: 0 }],
      beforeImage: null,
      afterImage: null,
      gallery: [{ id: null, src: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/old-g' }],
    } as unknown as ProjectWithGallery;
    render(<ProjectForm initialData={project} submitLabel='Save' isSubmitting={false} onSubmit={onSubmit} />);
    expect(screen.getByText(/1 legacy image is still on this gallery/)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const sent = onSubmit.mock.calls[0]![0];
    expect(sent).not.toHaveProperty('beforeImageMediaId');
    expect(sent).not.toHaveProperty('afterImageMediaId');
    expect(sent).not.toHaveProperty('galleryMediaIds');

    fireEvent.click(screen.getByText('add gallery image'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1]![0]).toMatchObject({ galleryMediaIds: ['g1'] });
  });
});
