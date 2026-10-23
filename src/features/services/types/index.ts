import type { PublicImage } from '@/lib/media/public-image';
import type { Service as ServiceRow, NewService } from '@/server/db/schema';
import type {
  CreateServiceInput,
  ReorderServicesInput,
  ServiceListQuery,
  UpdateServiceInput,
} from '@/validations/service-schema';

type WithoutLegacy<T> = {
  [K in keyof T as K extends `${string}Public${string}` ? never : K]: T[K];
};

// Rows from the server carry the resolved images beside the *MediaId columns.
export type Service = WithoutLegacy<ServiceRow> & { icon: PublicImage | null; image: PublicImage | null };

export type { NewService, CreateServiceInput, UpdateServiceInput, ServiceListQuery, ReorderServicesInput };

// Shape returned by the public `/services` route — same row shape as admin, kept as an
// alias so marketing components read intent rather than the admin type name.
export type ServicePublic = Service;

export interface ServiceListFilters {
  page: number;
  limit: number;
}
