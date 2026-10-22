import type { PublicImage } from '@/lib/media/public-image';
import type { HomepageCatalog as HomepageCatalogRow, NewHomepageCatalog } from '@/server/db/schema';
import type {
  CreateHomepageCatalogInput,
  HomepageCatalogIcon,
  HomepageCatalogListQuery,
  ReorderHomepageCatalogsInput,
  UpdateHomepageCatalogInput,
} from '@/validations/homepage-catalog-schema';

// `icon` is the lucide icon name; `iconImage` is the optional uploaded icon.
export type HomepageCatalog = HomepageCatalogRow & { iconImage: PublicImage | null };

export type {
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
