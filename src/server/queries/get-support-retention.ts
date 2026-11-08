import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { parseGlobal } from '@/lib/content/globals';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { settingsRepository } from '@/server/repositories/settings-repository';

// The privacy settings are not public, so only this one number reaches the public site.
async function readMonths(): Promise<number> {
  'use cache';
  cacheTag(settingTag('privacy'));
  cacheLife('max');
  return parseGlobal('privacy', (await settingsRepository.get('privacy'))?.value).enquiryRetentionMonths;
}

export async function getSupportRetentionMonths(): Promise<number> {
  try {
    return await readMonths();
  } catch {
    return parseGlobal('privacy', undefined).enquiryRetentionMonths;
  }
}
