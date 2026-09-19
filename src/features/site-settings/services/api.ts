import { API_ROUTES } from '@/lib/routes/api-routes';
import type {
  SiteSettings,
  UpdateBusinessInfoInput,
  UpdateContactInput,
  UpdateBrandingInput,
  UpdateHeroMediaInput,
  UpdateHomepageCatalogInput,
  UpdateServicesHeroInput,
  UpdateOurWorkHeroInput,
  UpdateInsurancePageInput,
  UpdateAboutPageInput,
  UpdateProcessPageInput,
  UpdateHomepageHeroInput,
  UpdateSeoInput,
  UpdateSocialLinksInput,
} from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_PREFIX}${process.env.NEXT_PUBLIC_API_VERSION}`;

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body?.error?.message ?? 'Request failed');
  }
  return body.data as T;
}

export async function fetchAdminSiteSettings(): Promise<SiteSettings | null> {
  const res = await fetch(`${BASE_URL}${API_ROUTES.siteSettings.admin}`, {
    credentials: 'include',
  });
  return parseOrThrow<SiteSettings | null>(res);
}

function patchSection<T>(path: string, input: T): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateBusinessInfo(input: UpdateBusinessInfoInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateBusinessInfo, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateContact(input: UpdateContactInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateContact, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateSocialLinks(input: UpdateSocialLinksInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateSocialLinks, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateBranding(input: UpdateBrandingInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateBranding, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateHeroMedia(input: UpdateHeroMediaInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateHeroMedia, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateSeo(input: UpdateSeoInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateSeo, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateHomepageHero(input: UpdateHomepageHeroInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateHomepageHero, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateHomepageCatalog(input: UpdateHomepageCatalogInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateHomepageCatalog, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateServicesHero(input: UpdateServicesHeroInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateServicesHero, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateOurWorkHero(input: UpdateOurWorkHeroInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateOurWorkHero, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateInsurancePage(input: UpdateInsurancePageInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateInsurancePage, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateAboutPage(input: UpdateAboutPageInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateAboutPage, input);
  return parseOrThrow<SiteSettings>(res);
}

export async function updateProcessPage(input: UpdateProcessPageInput): Promise<SiteSettings> {
  const res = await patchSection(API_ROUTES.siteSettings.updateProcessPage, input);
  return parseOrThrow<SiteSettings>(res);
}
