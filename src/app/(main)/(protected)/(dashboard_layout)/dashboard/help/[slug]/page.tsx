import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HelpArticleView } from '@/features/help/components/help-view';
import { listOwnerContacts } from '@/features/help/owner-contacts';
import { canReadArticle, helpArticle, helpHref } from '@/features/help/registry';
import { permissionFor } from '@/lib/admin/route-permissions';
import { requireActor, requirePermission } from '@/server/lib/auth/session';

// Reads the session per request (auth check + the role's articles).
export const instant = false;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = helpArticle(slug);
  return {
    title: article ? `${article.title} · Help` : 'Help',
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function HelpArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  // Signed in before the 404, so a stranger never learns which paths exist.
  await requireActor(helpHref(slug));
  const article = helpArticle(slug);
  if (!article) notFound();
  const actor = await requirePermission(permissionFor(helpHref(slug)), helpHref(slug));
  // An article about screens the viewer's role cannot open is not listed, and not served either.
  if (!canReadArticle(actor.roles, article)) notFound();
  const owners = article.sections.some((s) => s.blocks.some((b) => b.type === 'owners'))
    ? await listOwnerContacts()
    : [];
  return <HelpArticleView article={article} roles={actor.roles} owners={owners} />;
}
