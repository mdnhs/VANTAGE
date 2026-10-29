import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS } from '@/lib/cache/tags';
import { seoPageKey } from '@/lib/content/globals-seo';
import { siteNameFrom } from '@/lib/content/site-name';
import { projectPath, servicePath } from '@/lib/seo/detail-paths';
import { llmsText } from '@/lib/seo/llms';
import { blank, pageDescription } from '@/lib/seo/metadata';
import { PUBLIC_PAGE_LIST } from '@/lib/seo/public-pages';
import { settingTag } from '@/server/lib/cache/settings-tags';
import { isSelfCanonical } from '@/server/queries/get-page-seo';
import { getSetting } from '@/server/queries/get-setting';
import { legalPageService } from '@/server/services/legal-page-service';
import { projectService } from '@/server/services/project-service';
import { serviceService } from '@/server/services/service-service';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const url = (path: string) => (path === '/' ? `${APP_URL}/` : `${APP_URL}${path}`);

// The /llms.txt body, or null when it is switched off or the site is hidden from search.
// Lists what the sitemap lists: indexable, self-canonical pages and their services/projects.
export async function getLlmsTxt(): Promise<string | null> {
  'use cache';
  cacheTag(
    settingTag('seo'),
    settingTag('site'),
    settingTag('contact'),
    CACHE_TAGS.all('services'),
    CACHE_TAGS.all('projects'),
    CACHE_TAGS.all('legal-pages'),
  );
  for (const page of PUBLIC_PAGE_LIST) cacheTag(settingTag(seoPageKey(page.id)));
  cacheLife('max');

  const [defaults, site, contact] = await Promise.all([getSetting('seo'), getSetting('site'), getSetting('contact')]);
  if (defaults.robots === 'noindex' || !defaults.llms.enabled) return null;
  const name = siteNameFrom(site.name);

  const pages = (
    await Promise.all(PUBLIC_PAGE_LIST.map(async (page) => ({ page, seo: await getSetting(seoPageKey(page.id)) })))
  ).filter(({ page, seo }) => !seo.noindex && isSelfCanonical(seo.canonical, page.path));
  const listed = (path: string) => pages.some(({ page }) => page.path === path);
  const [services, projects, legal] = await Promise.all([
    listed('/services') ? serviceService.listPublished() : [],
    listed('/our-work') ? projectService.listPublished() : [],
    legalPageService.listPublishedForSitemap(),
  ]);

  // What the sitemap lists: rows not set noindex and not pointing their canonical elsewhere.
  const listable = (row: { noindex: boolean; canonical: string | null }, path: string) =>
    !row.noindex && isSelfCanonical(row.canonical ?? '', path);
  const address = [...contact.address.lines, contact.address.city, contact.address.eircode, contact.address.country]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(', ');
  return llmsText({
    siteName: name,
    summary:
      blank(defaults.llms.summary) ??
      pageDescription({
        id: 'home',
        seo: await getSetting(seoPageKey('home')),
        defaults,
        siteName: name,
        ogImage: null,
      }) ??
      '',
    details: [
      address && `Address: ${address}`,
      contact.phone.display && `Phone: ${contact.phone.display}`,
      contact.email && `Email: ${contact.email}`,
      contact.hours.summary && `Opening hours: ${contact.hours.summary}`,
      `Website: ${url('/')}`,
    ].filter((v): v is string => Boolean(v)),
    pages: pages.map(({ page, seo }) => ({
      title: blank(seo.title) ?? (page.id === 'home' ? name : page.title),
      url: url(page.path),
      description: pageDescription({ id: page.id, seo, defaults, siteName: name, ogImage: null }),
    })),
    services: services
      .filter((s) => listable(s, servicePath(s.slug)))
      .map((s) => ({
        title: s.name,
        url: url(servicePath(s.slug)),
        description: s.seoDescription || s.description,
      })),
    projects: projects
      .filter((p) => listable(p, projectPath(p.slug)))
      .map((p) => ({
        title: `${p.title} (${p.vehicleModel})`,
        url: url(projectPath(p.slug)),
        description: p.seoDescription || p.description,
      })),
    legal: legal.filter((l) => listable(l, `/${l.slug}`)).map((l) => ({ title: l.title, url: url(`/${l.slug}`) })),
  });
}
