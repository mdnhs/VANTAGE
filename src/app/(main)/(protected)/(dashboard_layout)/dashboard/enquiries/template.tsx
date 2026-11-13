import type { ReactNode } from 'react';

import { PageEnter } from '@/components/admin/motion/page-enter';

// Remounted by Next on every navigation inside this segment: the page fades in while the
// layouts above it stay put.
export default function Template({ children }: { children: ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
