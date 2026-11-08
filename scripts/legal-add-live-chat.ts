// Adds the live chat section to the published privacy policy, once.
//   yarn legal:add-live-chat           show what would be added; nothing is written
//   yarn legal:add-live-chat --apply   write it (safe to repeat)
// Run before the deploy that turns the chat on, so the rebuilt page already includes it.
import { fail } from './lib/cli-env';

const SLUG = 'privacy-policy';

async function main() {
  const apply = process.argv.slice(2).includes('--apply');
  const { eq } = await import('drizzle-orm');
  const { db } = await import('@/server/db');
  const { legalPages } = await import('@/server/db/schema');
  const { audit } = await import('@/server/lib/audit');
  const { parseGlobal } = await import('@/lib/content/globals');
  const { addLiveChatSection } = await import('@/lib/legal/live-chat-policy');
  const { settingsRepository } = await import('@/server/repositories/settings-repository');
  const { tiptapDocSchema } = await import('@/validations/legal-page-schema');

  const [page] = await db.select().from(legalPages).where(eq(legalPages.slug, SLUG)).limit(1);
  if (!page) throw new Error(`No legal page with the slug ${SLUG}`);

  const privacy = parseGlobal('privacy', (await settingsRepository.get('privacy'))?.value);
  const today = new Date();
  const { doc, changed } = addLiveChatSection(page.content, {
    retentionMonths: privacy.enquiryRetentionMonths,
    today,
  });
  if (!changed) {
    console.log('OK the policy already covers live chat; nothing to do');
    process.exit(0);
  }
  tiptapDocSchema.parse(doc);

  const before = new Set(page.content.content.map((node) => JSON.stringify(node)));
  for (const node of doc.content) {
    if (before.has(JSON.stringify(node))) continue;
    console.log(`+ ${node.content?.map((child) => child.text).join('')}`);
  }
  if (!apply) {
    console.log('DRY RUN: nothing was written. Add --apply to save it.');
    process.exit(0);
  }

  await db
    .update(legalPages)
    .set({ content: doc, publishedAt: today, updatedAt: today })
    .where(eq(legalPages.id, page.id));
  await audit(null, {
    action: 'legal.update',
    entityType: 'legal_page',
    entityId: page.id,
    summary: 'Live chat section added to the privacy policy',
  });
  console.log('OK the live chat section was added');
  process.exit(0);
}

main().catch(fail);
