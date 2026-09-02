export const CACHE_TAGS = {
  list: (resource: string) => `${resource}:list`,
  detail: (resource: string, id: string) => `${resource}:${id}`,
  all: (resource: string) => resource,
} as const;
