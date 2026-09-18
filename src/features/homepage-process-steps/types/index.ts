import type { HomepageProcessStep, NewHomepageProcessStep } from '@/server/db/schema';
import type {
  CreateHomepageProcessStepInput,
  HomepageProcessStepListQuery,
  ReorderHomepageProcessStepsInput,
  UpdateHomepageProcessStepInput,
} from '@/validations/homepage-process-step-schema';

export type {
  HomepageProcessStep,
  NewHomepageProcessStep,
  CreateHomepageProcessStepInput,
  UpdateHomepageProcessStepInput,
  HomepageProcessStepListQuery,
  ReorderHomepageProcessStepsInput,
};

// Shape returned by the public `/homepage-process-steps` route — same row shape as admin,
// kept as an alias so marketing components read intent rather than the admin type name.
export type HomepageProcessStepPublic = HomepageProcessStep;

export interface HomepageProcessStepListFilters {
  page: number;
  limit: number;
}
