export const themeKeys = {
  all: ['theme'] as const,
  detail: () => [...themeKeys.all, 'detail'] as const,
  revisions: () => [...themeKeys.all, 'revisions'] as const,
};
