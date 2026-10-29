import type { PublicImage } from '@/lib/media/public-image';
import type { Project as ProjectRow, ProjectGalleryImage as ProjectGalleryImageRow } from '@/server/db/schema';
import type {
  CreateProjectInput,
  ProjectListQuery,
  ProjectStatusInput,
  ReorderProjectsInput,
  UpdateProjectInput,
} from '@/validations/project-schema';

type WithoutLegacy<T> = {
  [K in keyof T as K extends `${string}Public${string}` ? never : K]: T[K];
};

export type Project = WithoutLegacy<ProjectRow>;
export type ProjectGalleryImage = WithoutLegacy<ProjectGalleryImageRow>;

export type { CreateProjectInput, UpdateProjectInput, ProjectListQuery, ReorderProjectsInput, ProjectStatusInput };

// Rows returned by repo/service reads always include the gallery relation.
export type ProjectWithGallery = WithoutLegacy<Project> & {
  galleryImages: WithoutLegacy<ProjectGalleryImage>[];
  beforeImage: PublicImage | null;
  afterImage: PublicImage | null;
  ogImage: PublicImage | null;
  gallery: PublicImage[];
};

// Shape returned by the public `/projects` and `/projects/featured` routes.
export type ProjectPublic = ProjectWithGallery;

export interface ProjectListFilters {
  page: number;
  limit: number;
}

export const PROJECT_STATUS_VALUES = ['draft', 'published'] as const;
export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];

// The wire payload sent from the browser: JSON has no Date type, so `completedAt` travels
// as a plain 'YYYY-MM-DD' string (or null) — the Hono route's `z.coerce.date()` on
// createProjectSchema/updateProjectSchema turns it back into a Date server-side.
export type ProjectCreatePayload = Omit<CreateProjectInput, 'completedAt' | 'isFeatured'> & {
  isFeatured?: boolean;
  completedAt?: string | null;
};
export type ProjectUpdatePayload = Omit<UpdateProjectInput, 'completedAt'> & { completedAt?: string | null };
