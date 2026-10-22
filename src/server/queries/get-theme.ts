import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { draftMode } from 'next/headers';
import { parseTheme, type SiteThemeConfig, type ThemeConfigValue } from '@/lib/theme/schema';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { settingsRepository } from '@/server/repositories/settings-repository';

// Published theme (admin frame). Missing row or drift renders the defaults.
export async function getPublishedTheme(): Promise<ThemeConfigValue> {
  'use cache';
  cacheTag(settingTag('theme'));
  cacheLife('max');
  const row = await settingsRepository.get('theme');
  return parseTheme(row?.value);
}

// Site half for the public layout. Draft-mode requests (set only by GET /preview behind
// appearance.read) see the saved draft; draft-mode requests bypass the cache, so a draft
// never leaks into the shared entry.
export async function getSiteThemeForRender(): Promise<{ site: SiteThemeConfig; preview: boolean }> {
  'use cache';
  cacheTag(settingTag('theme'));
  cacheLife('max');
  const enabled = (await draftMode()).isEnabled;
  const row = await settingsRepository.get('theme');
  if (enabled && row?.draft != null) return { site: parseTheme(row.draft).site, preview: true };
  return { site: parseTheme(row?.value).site, preview: false };
}
