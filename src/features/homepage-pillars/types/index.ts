import type { HomepagePillar, NewHomepagePillar } from '@/server/db/schema';
import type {
  CreateHomepagePillarInput,
  HomepagePillarListQuery,
  ReorderHomepagePillarsInput,
  UpdateHomepagePillarInput,
} from '@/validations/homepage-pillar-schema';

export type {
  HomepagePillar,
  NewHomepagePillar,
  CreateHomepagePillarInput,
  UpdateHomepagePillarInput,
  HomepagePillarListQuery,
  ReorderHomepagePillarsInput,
};

// Shape returned by the public `/homepage-pillars` route — same row shape as admin, kept as
// an alias so marketing components read intent rather than the admin type name.
export type HomepagePillarPublic = HomepagePillar;

export interface HomepagePillarListFilters {
  page: number;
  limit: number;
}
