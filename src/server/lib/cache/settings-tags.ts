// One cache tag per settings key, so saving one document never invalidates another.
export const settingTag = (key: string) => `settings:${key}`;
