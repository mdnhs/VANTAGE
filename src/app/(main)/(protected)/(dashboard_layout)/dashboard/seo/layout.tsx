import type { ReactNode } from 'react';

import { SectionRail } from '@/components/admin/shell/section-rail';

// The seo section's sub-page menu lives in this layout, so it stays mounted while
// its pages change: only the page beside it reloads (and shows its skeleton).
export default function SectionLayout({ children }: { children: ReactNode }) {
  return <SectionRail section='seo'>{children}</SectionRail>;
}
