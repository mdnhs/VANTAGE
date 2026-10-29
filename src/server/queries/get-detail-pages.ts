import 'server-only';

import type { Metadata } from 'next';

import { excerptOf } from '@/lib/legal-pages/render';
import { projectPath, servicePath } from '@/lib/seo/detail-paths';
import { detailPageMetadata } from '@/lib/seo/metadata';
import { resolveImageRef } from '@/server/queries/get-page-seo';
import { getSetting } from '@/server/queries/get-setting';
import { legalPageService } from '@/server/services/legal-page-service';
import { projectService } from '@/server/services/project-service';
import { serviceService } from '@/server/services/service-service';
import { siteSettingsService } from '@/server/services/site-settings-service';

// Cached lookups: the project list is small, so a slug lookup reads it rather than adding a query.
export async function publishedService(slug: string) {
  return serviceService.getPublishedBySlug(slug);
}

export async function publishedProject(slug: string) {
  return (await projectService.listPublished()).find((p) => p.slug === slug) ?? null;
}

async function shared() {
  const [settings, defaults, contact] = await Promise.all([
    siteSettingsService.getPublic(),
    getSetting('seo'),
    getSetting('contact'),
  ]);
  return {
    siteName: settings.businessName,
    city: contact.address.city.trim(),
    defaults,
    defaultImage: await resolveImageRef(defaults.defaultOgImage),
  };
}

// null when the slug is not a live page, so the caller renders its not-found metadata.
export async function serviceMetadata(slug: string): Promise<Metadata | null> {
  const service = await publishedService(slug);
  if (!service) return null;
  const { siteName, city, defaults, defaultImage } = await shared();
  return detailPageMetadata({
    path: servicePath(service.slug),
    seo: service,
    fallbackTitle: city ? `${service.name} in ${city}` : service.name,
    fallbackDescription: service.description,
    defaults,
    siteName,
    image: service.ogImage ?? service.image ?? defaultImage,
  });
}

export async function projectMetadata(slug: string): Promise<Metadata | null> {
  const project = await publishedProject(slug);
  if (!project) return null;
  const { siteName, defaults, defaultImage } = await shared();
  return detailPageMetadata({
    path: projectPath(project.slug),
    seo: project,
    fallbackTitle: `${project.title}: ${project.vehicleModel}`,
    fallbackDescription: project.description,
    defaults,
    siteName,
    image: project.ogImage ?? project.afterImage ?? defaultImage,
  });
}

// A published legal page (/<slug>); without its own description it uses the opening of its text.
export async function legalPageMetadata(slug: string): Promise<Metadata | null> {
  const page = await legalPageService.getPublishedBySlug(slug);
  if (!page) return null;
  const { siteName, defaults, defaultImage } = await shared();
  const own = page.ogImageMediaId ? await resolveImageRef({ kind: 'media', id: page.ogImageMediaId }) : null;
  return detailPageMetadata({
    path: `/${page.slug}`,
    seo: page,
    fallbackTitle: page.title,
    fallbackDescription: excerptOf(page.content),
    defaults,
    siteName,
    image: own ?? defaultImage,
  });
}
