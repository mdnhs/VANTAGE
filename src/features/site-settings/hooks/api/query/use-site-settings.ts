'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAdminSiteSettings } from '../../../services/api';

export const SITE_SETTINGS_QUERY_KEY = ['site-settings', 'admin'] as const;

// Admin settings-form pre-fill. The service behind this route is uncached (single row,
// always fresh) — no polling here either, it's a normal one-shot fetch on mount.
export function useSiteSettings() {
  return useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchAdminSiteSettings,
  });
}
