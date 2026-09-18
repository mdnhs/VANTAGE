import type { NewPartnerLogo, PartnerLogo } from '@/server/db/schema';
import type {
  CreatePartnerLogoInput,
  PartnerLogoListQuery,
  ReorderPartnerLogosInput,
  UpdatePartnerLogoInput,
} from '@/validations/partner-logo-schema';

export type {
  PartnerLogo,
  NewPartnerLogo,
  CreatePartnerLogoInput,
  UpdatePartnerLogoInput,
  PartnerLogoListQuery,
  ReorderPartnerLogosInput,
};

// Shape returned by the public `/partner-logos` route — same row shape as admin, kept as an
// alias so marketing components read intent rather than the admin type name.
export type PartnerLogoPublic = PartnerLogo;

export interface PartnerLogoListFilters {
  page: number;
  limit: number;
}
