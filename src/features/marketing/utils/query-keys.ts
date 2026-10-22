export const trackingKeys = {
  all: ['tracking'] as const,
  detail: () => [...trackingKeys.all, 'detail'] as const,
  save: () => [...trackingKeys.all, 'save'] as const,
};
