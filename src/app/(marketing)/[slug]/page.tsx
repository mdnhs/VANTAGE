import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalPageView } from '@/components/marketing/legal-page-view';
import { excerptOf, renderLegalHtml } from '@/lib/legal-pages/render';
import { legalPageService } from '@/server/services/legal-page-service';

// Admin-created legal pages (Dashboard → Legal pages) at the site root. Static marketing routes
// win over this segment. Slugs are only known at request time, so the page is not prerendered;
// the row itself comes from the tag-cached service, so a request costs no database hit.
export const instant = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await legalPageService.getPublishedBySlug(slug);
  if (!page) return { title: 'Page not found', robots: { index: false } };
  return {
    title: page.title,
    description: excerptOf(page.content) || undefined,
    alternates: { canonical: `/${page.slug}` },
  };
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = await legalPageService.getPublishedBySlug(slug);
  if (!page) notFound();
  return <LegalPageView title={page.title} updatedAt={page.publishedAt} html={renderLegalHtml(page.content)} />;
}
