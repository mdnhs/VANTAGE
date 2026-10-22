import type { RoleName } from './permissions';

export const ROLE_LABELS: Record<RoleName, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  author: 'Author',
  marketer: 'Marketer',
  intake: 'Intake',
  viewer: 'Viewer',
};

export const ROLE_PURPOSE: Record<RoleName, string> = {
  owner: 'Everything, including other owners and custom code.',
  admin: 'Everything except custom code and managing owners.',
  editor: 'Page copy, site content, media and SEO.',
  author: 'Create and edit content (projects: their own), without deleting.',
  marketer: 'SEO, redirects and tracking. No quotes or messages.',
  intake: 'The quotes and contact messages inbox only.',
  viewer: 'Read-only access.',
};
