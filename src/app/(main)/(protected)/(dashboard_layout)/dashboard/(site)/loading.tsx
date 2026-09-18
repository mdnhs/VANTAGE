import { FormPageSkeleton } from '@/components/layout/page-skeleton';

// Lives inside the (site) layout, so the left page menu stays put while only the editor
// area shows a skeleton.
export default function SiteContentLoading() {
  return <FormPageSkeleton />;
}
