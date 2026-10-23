import type { EditableGlobalKey } from '@/lib/content/global-access';

export const globalKeys = {
  all: ['globals'] as const,
  detail: (key: EditableGlobalKey) => [...globalKeys.all, 'detail', key] as const,
  revisions: (key: EditableGlobalKey) => [...globalKeys.all, 'revisions', key] as const,
};
