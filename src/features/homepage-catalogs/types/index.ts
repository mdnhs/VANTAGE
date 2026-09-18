import type { HomepageCatalog, NewHomepageCatalog } from '@/server/db/schema';
import type {
  CreateHomepageCatalogInput,
  HomepageCatalogIcon,
  HomepageCatalogListQuery,
  ReorderHomepageCatalogsInput,
  UpdateHomepageCatalogInput,
} from '@/validations/homepage-catalog-schema';

export type {
  HomepageCatalog,
  NewHomepageCatalog,
  CreateHomepageCatalogInput,
  UpdateHomepageCatalogInput,
  HomepageCatalogListQuery,
  ReorderHomepageCatalogsInput,
  HomepageCatalogIcon,
};

// Shape returned by public `/homepage-catalogs`
export type HomepageCatalogPublic = HomepageCatalog;

export interface HomepageCatalogListFilters {
  page: number;
  limit: number;
}
