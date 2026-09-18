import type { Service, NewService } from '@/server/db/schema';
import type {
  CreateServiceInput,
  ReorderServicesInput,
  ServiceListQuery,
  UpdateServiceInput,
} from '@/validations/service-schema';

export type { Service, NewService, CreateServiceInput, UpdateServiceInput, ServiceListQuery, ReorderServicesInput };

// Shape returned by the public `/services` route — same row shape as admin, kept as an
// alias so marketing components read intent rather than the admin type name.
export type ServicePublic = Service;

export interface ServiceListFilters {
  page: number;
  limit: number;
}
